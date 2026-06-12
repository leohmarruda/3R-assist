"""Retrieval service — filter-based matching (MVP) or semantic search."""

from __future__ import annotations

import logging
from collections.abc import Callable

from app.adapters.embedder import EmbedderAdapter
from app.models.method import Method
from app.models.protocol import ProtocolParameters
from app.models.recommendation import Recommendation
from app.repositories.methods import MethodRepository

logger = logging.getLogger(__name__)

MIN_RESULTS = 3


def build_query_text(params: ProtocolParameters) -> str:
    parts: list[str] = []
    if params.endpoint_category:
        parts.append(params.endpoint_category)
    if params.procedure_text:
        parts.append(params.procedure_text)
    if params.application_area:
        parts.append(params.application_area)
    if params.route:
        parts.extend(params.route)
    return " ".join(parts)


def cosine_similarity(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right, strict=True))


def _token_set(text: str) -> set[str]:
    return {token for token in text.lower().split() if len(token) > 2}


def filter_only_score(method: Method, params: ProtocolParameters) -> float:
    """Heuristic score for MVP validation without embedding models."""
    score = 0.5
    score += 0.15 * len(_matched_params(method, params))
    if params.procedure_text:
        overlap = len(_token_set(params.procedure_text) & _token_set(method.text_for_embedding))
        score += min(0.35, overlap * 0.05)
    return min(1.0, round(score, 4))


def _matches_endpoint(method: Method, params: ProtocolParameters) -> bool:
    if params.endpoint_category is None:
        return True
    return method.endpoint_category == params.endpoint_category


def _matches_route(method: Method, params: ProtocolParameters) -> bool:
    if not params.route:
        return True
    if not method.routes_applicable:
        return True
    return any(route in method.routes_applicable for route in params.route)


def _apply_filters(
    methods: list[Method],
    params: ProtocolParameters,
    *,
    endpoint: bool,
    route: bool,
) -> list[Method]:
    filtered: list[Method] = []
    for method in methods:
        if endpoint and not _matches_endpoint(method, params):
            continue
        if route and not _matches_route(method, params):
            continue
        filtered.append(method)
    return filtered


def _matched_params(method: Method, params: ProtocolParameters) -> list[str]:
    matched: list[str] = []
    if params.endpoint_category and method.endpoint_category == params.endpoint_category:
        matched.append("endpoint_category")
    if params.route and (
        not method.routes_applicable
        or any(route in method.routes_applicable for route in params.route)
    ):
        matched.append("route")
    if params.application_area and method.application_area == params.application_area:
        matched.append("application_area")
    return matched


def _build_recommendations(
    scored: list[tuple[Method, float]],
    params: ProtocolParameters,
) -> list[Recommendation]:
    scored.sort(key=lambda item: (-item[1], item[0].slug))
    return [
        Recommendation(
            method=method,
            rank=index,
            score=score,
            matched_params=_matched_params(method, params),
        )
        for index, (method, score) in enumerate(scored, start=1)
    ]


class RetrievalService:
    def __init__(
        self,
        repository: MethodRepository,
        embedder: EmbedderAdapter,
        *,
        semantic_ranking: bool = False,
    ) -> None:
        self._repository = repository
        self._embedder = embedder
        self._semantic_ranking = semantic_ranking

    async def search(
        self,
        params: ProtocolParameters,
    ) -> tuple[list[Recommendation], str | None]:
        methods = await self._repository.list_active()
        if not methods:
            return [], None

        if self._semantic_ranking:
            return self._search_semantic(methods, params)
        return self._search_filter_only(methods, params)

    def _search_with_relaxation(
        self,
        candidates: list[Method],
        params: ProtocolParameters,
        rank: Callable[[list[Method], ProtocolParameters], list[Recommendation]],
    ) -> tuple[list[Recommendation], str | None]:
        relaxation: str | None = None

        filtered = _apply_filters(candidates, params, endpoint=True, route=True)
        ranked = rank(filtered, params)

        if len(ranked) < MIN_RESULTS:
            relaxation = "route_filter_relaxed"
            filtered = _apply_filters(candidates, params, endpoint=True, route=False)
            ranked = rank(filtered, params)

        if len(ranked) < MIN_RESULTS:
            relaxation = "endpoint_and_route_filters_relaxed"
            ranked = rank(candidates, params)[:MIN_RESULTS]

        if relaxation:
            logger.info("Retrieval filter relaxation applied: %s", relaxation)

        return ranked, relaxation

    def _search_filter_only(
        self,
        methods: list[Method],
        params: ProtocolParameters,
    ) -> tuple[list[Recommendation], str | None]:
        return self._search_with_relaxation(methods, params, self._rank_filter_only)

    def _search_semantic(
        self,
        methods: list[Method],
        params: ProtocolParameters,
    ) -> tuple[list[Recommendation], str | None]:
        scorable = [method for method in methods if method.embedding_json]
        if not scorable:
            return [], None

        query_text = build_query_text(params)
        if not query_text.strip():
            return [], None

        query_vector = self._embedder.embed(query_text)
        return self._search_with_relaxation(
            scorable,
            params,
            lambda filtered, p: self._rank_semantic(filtered, query_vector, p),
        )

    def _rank_filter_only(
        self,
        methods: list[Method],
        params: ProtocolParameters,
    ) -> list[Recommendation]:
        scored = [(method, filter_only_score(method, params)) for method in methods]
        return _build_recommendations(scored, params)

    def _rank_semantic(
        self,
        methods: list[Method],
        query_vector: list[float],
        params: ProtocolParameters,
    ) -> list[Recommendation]:
        scored: list[tuple[Method, float]] = []
        for method in methods:
            if not method.embedding_json:
                continue
            score = round(cosine_similarity(query_vector, method.embedding_json), 4)
            scored.append((method, score))
        return _build_recommendations(scored, params)
