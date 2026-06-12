"""AdminRepository — read-only access to public database tables."""

from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from app.db.connection import get_pool

_TABLE_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9_]*$")


def _serialize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, (bytes, bytearray, memoryview)):
        return value.hex()
    return value


def _serialize_row(row) -> dict[str, Any]:
    return {key: _serialize_value(value) for key, value in dict(row).items()}


class AdminRepository:
    async def list_tables(self) -> list[str]:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_type = 'BASE TABLE'
                ORDER BY table_name
                """
            )
        return [row["table_name"] for row in rows]

    async def _table_exists(self, conn, table_name: str) -> bool:
        return bool(
            await conn.fetchval(
                """
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_type = 'BASE TABLE'
                  AND table_name = $1
                """,
                table_name,
            )
        )

    async def fetch_table(
        self,
        table_name: str,
        *,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        if not _TABLE_NAME_PATTERN.match(table_name):
            raise ValueError(f"Invalid table name: {table_name}")

        pool = await get_pool()
        async with pool.acquire() as conn:
            if not await self._table_exists(conn, table_name):
                raise LookupError(table_name)

            total = await conn.fetchval(f'SELECT COUNT(*) FROM "{table_name}"')
            rows = await conn.fetch(
                f'SELECT * FROM "{table_name}" LIMIT $1 OFFSET $2',
                limit,
                offset,
            )
            column_rows = await conn.fetch(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position
                """,
                table_name,
            )

        serialized_rows = [_serialize_row(row) for row in rows]
        columns = [row["column_name"] for row in column_rows]

        return {
            "table": table_name,
            "columns": columns,
            "rows": serialized_rows,
            "total": total,
            "limit": limit,
            "offset": offset,
        }
