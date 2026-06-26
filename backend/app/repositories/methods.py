"""MethodRepository — query logic for curated methods."""

from __future__ import annotations

import json
from collections import defaultdict

from app.db.connection import get_pool
from app.models.method import Method, MethodValidationContext


class MethodRepository:
    _SELECT_ACTIVE = """
        SELECT
            id, slug, name_en, name_pt, description_en, description_pt,
            text_for_embedding, category_3r, endpoint_category, study_domain,
            oecd_tg_ref, ncit_id, source_db,
            routes_applicable, embedding_json, active, created_at, updated_at
        FROM methods
        WHERE active = TRUE
        ORDER BY slug
    """

    _SELECT_CONTEXTS = """
        SELECT
            method_id, study_domain, jurisdiction, validation_status,
            regulatory_body, regulatory_ref, regulatory_url, notes
        FROM method_validation_contexts
        WHERE method_id = ANY($1::int[])
        ORDER BY method_id, study_domain, jurisdiction
    """

    async def list_active(self) -> list[Method]:
        methods, _ = await self.list_active_with_contexts()
        return methods

    async def list_active_with_contexts(
        self,
    ) -> tuple[list[Method], dict[int, list[MethodValidationContext]]]:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(self._SELECT_ACTIVE)
            if not rows:
                return [], {}

            methods = [self._row_to_method(row) for row in rows]
            method_ids = [method.id for method in methods]
            context_rows = await conn.fetch(self._SELECT_CONTEXTS, method_ids)

        contexts_by_method: dict[int, list[MethodValidationContext]] = defaultdict(list)
        for row in context_rows:
            contexts_by_method[row["method_id"]].append(self._row_to_context(row))

        return methods, dict(contexts_by_method)

    @staticmethod
    def _parse_json_list(value) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            parsed = json.loads(value) if value else []
            return parsed if isinstance(parsed, list) else [parsed]
        return list(value)

    @staticmethod
    def _row_to_method(row) -> Method:
        routes = row["routes_applicable"]
        if isinstance(routes, str):
            routes = json.loads(routes) if routes else None

        embedding = row["embedding_json"]
        if isinstance(embedding, str):
            embedding = json.loads(embedding) if embedding else None

        category_3r = MethodRepository._parse_json_list(row["category_3r"])

        return Method(
            id=row["id"],
            slug=row["slug"],
            name_en=row["name_en"],
            name_pt=row["name_pt"],
            description_en=row["description_en"],
            description_pt=row["description_pt"],
            text_for_embedding=row["text_for_embedding"],
            category_3r=category_3r,
            endpoint_category=row["endpoint_category"],
            study_domain=row["study_domain"],
            oecd_tg_ref=row["oecd_tg_ref"],
            ncit_id=row.get("ncit_id"),
            source_db=row["source_db"],
            routes_applicable=routes,
            embedding_json=embedding,
            active=row["active"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _row_to_context(row) -> MethodValidationContext:
        return MethodValidationContext(
            study_domain=row["study_domain"],
            jurisdiction=row["jurisdiction"],
            validation_status=row["validation_status"],
            regulatory_body=row["regulatory_body"],
            regulatory_ref=row["regulatory_ref"],
            regulatory_url=row["regulatory_url"],
            notes=row["notes"],
        )
