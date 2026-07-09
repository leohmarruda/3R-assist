#!/usr/bin/env python3
"""Backfill 3R rationale placeholders from category_3r (ADR-023, steps 2–4).

For each R present in category_3r, sets the matching rationale column to an
identifiable placeholder when the column is still null/empty. Does not overwrite
expert-written text.

Usage:
    python scripts/backfill_3r_rationales.py              # step 2: placeholders
    python scripts/backfill_3r_rationales.py --check       # step 3: gate only
    python scripts/backfill_3r_rationales.py --apply-drop  # step 4: DROP if gate clean

008 lives in migrations/manual/ (not auto-applied by migrate.py) so the DROP
only runs after Karynn replaces every [PENDENTE] placeholder.

Gate (must return zero rows before --apply-drop):
    SELECT slug, category_3r,
           replacement_rationale, reduction_rationale, refinement_rationale
    FROM methods
    WHERE (category_3r @> '["replacement"]'::jsonb
           AND (replacement_rationale IS NULL
                OR replacement_rationale = '[PENDENTE — ver category_3r]'))
       OR (category_3r @> '["reduction"]'::jsonb
           AND (reduction_rationale IS NULL
                OR reduction_rationale = '[PENDENTE — ver category_3r]'))
       OR (category_3r @> '["refinement"]'::jsonb
           AND (refinement_rationale IS NULL
                OR refinement_rationale = '[PENDENTE — ver category_3r]'));
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

try:
    from dotenv import load_dotenv

    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env")
    load_dotenv(backend_dir.parent / ".env")
except ImportError:
    pass

import asyncpg

from app.config import get_settings
from app.db.connection import normalize_database_url, split_sql_statements

PLACEHOLDER = "[PENDENTE — ver category_3r]"
_DROP_MIGRATION = "008_drop_category_3r.sql"
_DROP_SQL_PATH = (
    Path(__file__).resolve().parents[1]
    / "app"
    / "db"
    / "migrations"
    / "manual"
    / _DROP_MIGRATION
)

_R_COLUMNS = (
    ("replacement", "replacement_rationale"),
    ("reduction", "reduction_rationale"),
    ("refinement", "refinement_rationale"),
)

_GATE_SQL = """
SELECT slug, category_3r,
       replacement_rationale, reduction_rationale, refinement_rationale
FROM methods
WHERE (category_3r @> '["replacement"]'::jsonb
       AND (replacement_rationale IS NULL
            OR replacement_rationale = $1))
   OR (category_3r @> '["reduction"]'::jsonb
       AND (reduction_rationale IS NULL
            OR reduction_rationale = $1))
   OR (category_3r @> '["refinement"]'::jsonb
       AND (refinement_rationale IS NULL
            OR refinement_rationale = $1))
ORDER BY slug
"""


async def _backfill(conn: asyncpg.Connection) -> None:
    for r_class, column in _R_COLUMNS:
        result = await conn.execute(
            f"""
            UPDATE methods
            SET {column} = $1
            WHERE category_3r @> $2::jsonb
              AND ({column} IS NULL OR BTRIM({column}) = '')
            """,
            PLACEHOLDER,
            json.dumps([r_class]),
        )
        print(f"{column}: {result}")


async def _check(conn: asyncpg.Connection) -> int:
    rows = await conn.fetch(_GATE_SQL, PLACEHOLDER)
    if not rows:
        print(
            "Gate: 0 pending rows — safe to run "
            "python scripts/backfill_3r_rationales.py --apply-drop"
        )
        return 0

    print(f"Gate: {len(rows)} method(s) still need real rationale text:")
    for row in rows:
        pending = []
        category = row["category_3r"]
        if isinstance(category, str):
            category = json.loads(category)
        for r_class, column in _R_COLUMNS:
            if r_class not in category:
                continue
            value = row[column]
            if value is None or value == PLACEHOLDER:
                pending.append(column)
        print(f"  {row['slug']}: {', '.join(pending)}")
    return 1


async def _apply_drop(conn: asyncpg.Connection) -> int:
    already = await conn.fetchval(
        "SELECT 1 FROM schema_migrations WHERE filename = $1",
        _DROP_MIGRATION,
    )
    if already:
        print(f"{_DROP_MIGRATION} already recorded in schema_migrations.")
        return 0

    if await _check(conn) != 0:
        return 1

    if not _DROP_SQL_PATH.is_file():
        print(f"ERROR: missing {_DROP_SQL_PATH}", file=sys.stderr)
        return 1

    statements = split_sql_statements(_DROP_SQL_PATH.read_text(encoding="utf-8"))
    async with conn.transaction():
        for statement in statements:
            await conn.execute(statement)
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        await conn.execute(
            "INSERT INTO schema_migrations (filename) VALUES ($1)",
            _DROP_MIGRATION,
        )
    print(f"Applied: {_DROP_MIGRATION}")
    return 0


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--check",
        action="store_true",
        help="Run the pre-DROP gate query only (no writes).",
    )
    group.add_argument(
        "--apply-drop",
        action="store_true",
        help="Apply manual/008_drop_category_3r.sql if the gate is clean.",
    )
    args = parser.parse_args()

    dsn = normalize_database_url(get_settings().database_url)
    conn = await asyncpg.connect(dsn)
    try:
        has_category = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'methods' AND column_name = 'category_3r'
            )
            """
        )
        if not has_category:
            print("category_3r already dropped — nothing to do.")
            return 0

        has_rationales = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'methods'
                  AND column_name = 'replacement_rationale'
            )
            """
        )
        if not has_rationales:
            print(
                "ERROR: rationale columns missing. "
                "Run python scripts/migrate.py first (007_add_3r_rationale_columns.sql).",
                file=sys.stderr,
            )
            return 1

        if args.apply_drop:
            return await _apply_drop(conn)

        if not args.check:
            await _backfill(conn)
            print()

        return await _check(conn)
    finally:
        await conn.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
