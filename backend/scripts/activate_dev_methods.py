#!/usr/bin/env python3
"""Activate a small set of methods for local end-to-end retrieval testing."""

from __future__ import annotations

import asyncio
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
from app.db.connection import normalize_database_url

DEV_SLUGS = (
    "niceatm-cytotox-basal-barranco",
    "oecd-tg420-fixed-dose",
    "oecd-tg423-atc",
    "oecd-tg425-udp",
)


async def main() -> int:
    dsn = normalize_database_url(get_settings().database_url)
    conn = await asyncpg.connect(dsn)
    try:
        result = await conn.execute(
            "UPDATE methods SET active = TRUE WHERE slug = ANY($1::text[])",
            list(DEV_SLUGS),
        )
        print(result)
        rows = await conn.fetch(
            "SELECT slug, active, embedding_json IS NOT NULL AS embedded "
            "FROM methods WHERE slug = ANY($1::text[]) ORDER BY slug",
            list(DEV_SLUGS),
        )
        for row in rows:
            print(f"  {row['slug']}: active={row['active']}, embedded={row['embedded']}")
        print("\nNext: python scripts/embed_methods.py")
    finally:
        await conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
