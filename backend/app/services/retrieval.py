"""Retrieval service — semantic search over active methods."""

from __future__ import annotations

import logging

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


class RetrievalService:
    def __init__(self, repository: MethodRepository, embedder: EmbedderAdapter) -> None:
        self._repository = repository
        self._embedder = embedder

    async def search(
        self,
        params: ProtocolParameters,
    ) -> tuple[list[Recommendation], str | None]:
        methods = await self._repository.list_active()
        scorable = [method for method in methods if method.embedding_json]
        if not scorable:
            return [], None

        query_text = build_query_text(params)
        if not query_text.strip():
            return [], None

        query_vector = self._embedder.embed(query_text)
        relaxation: str | None = None

        filtered = _apply_filters(scorable, params, endpoint=True, route=True)
        ranked = self._rank(filtered, query_vector, params)

        if len(ranked) < MIN_RESULTS:
            relaxation = "route_filter_relaxed"
            filtered = _apply_filters(scorable, params, endpoint=True, route=False)
            ranked = self._rank(filtered, query_vector, params)

        if len(ranked) < MIN_RESULTS:
            relaxation = "endpoint_and_route_filters_relaxed"
            ranked = self._rank(scorable, query_vector, params)[:MIN_RESULTS]

        if relaxation:
            logger.info("Retrieval filter relaxation applied: %s", relaxation)

        return ranked, relaxation

    def _rank(
        self,
        methods: list[Method],
        query_vector: list[float],
        params: ProtocolParameters,
    ) -> list[Recommendation]:
        scored: list[tuple[Method, float]] = []
        for method in methods:
            if not method.embedding_json:
                continue
            score = cosine_similarity(query_vector, method.embedding_json)
            scored.append((method, score))

        scored.sort(key=lambda item: item[1], reverse=True)
        return [
            Recommendation(
                method=method,
                rank=index,
                score=round(score, 4),
                matched_params=_matched_params(method, params),
            )
            for index, (method, score) in enumerate(scored, start=1)
        ]
