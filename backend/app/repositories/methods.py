"""MethodRepository — query logic for curated methods."""

from __future__ import annotations

import json

from app.db.connection import get_pool
from app.models.method import Method


class MethodRepository:
    _SELECT_ACTIVE = """
        SELECT
            id, slug, name_en, name_pt, description_en, description_pt,
            text_for_embedding, category_3r, endpoint_category, application_area,
            oecd_tg_ref, source_db, validation_status, jurisdiction,
            jurisdiction_notes, primary_lit_url, regulatory_url,
            routes_applicable, embedding_json, active, created_at, updated_at
        FROM methods
        WHERE active = TRUE
        ORDER BY slug
    """

    async def list_active(self) -> list[Method]:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(self._SELECT_ACTIVE)
        return [self._row_to_method(row) for row in rows]

    @staticmethod
    def _row_to_method(row) -> Method:
        routes = row["routes_applicable"]
        if isinstance(routes, str):
            routes = json.loads(routes) if routes else None

        embedding = row["embedding_json"]
        if isinstance(embedding, str):
            embedding = json.loads(embedding) if embedding else None

        return Method(
            id=row["id"],
            slug=row["slug"],
            name_en=row["name_en"],
            name_pt=row["name_pt"],
            description_en=row["description_en"],
            description_pt=row["description_pt"],
            text_for_embedding=row["text_for_embedding"],
            category_3r=row["category_3r"],
            endpoint_category=row["endpoint_category"],
            application_area=row["application_area"],
            oecd_tg_ref=row["oecd_tg_ref"],
            source_db=row["source_db"],
            validation_status=row["validation_status"],
            jurisdiction=row["jurisdiction"],
            jurisdiction_notes=row["jurisdiction_notes"],
            primary_lit_url=row["primary_lit_url"],
            regulatory_url=row["regulatory_url"],
            routes_applicable=routes,
            embedding_json=embedding,
            active=row["active"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
