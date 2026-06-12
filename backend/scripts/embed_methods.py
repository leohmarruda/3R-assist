#!/usr/bin/env python3
"""
embed_methods.py — Generate and store embeddings for all active methods.
PostgreSQL/asyncpg version (replaces sqlite3 version — ADR-013).

Usage:
    python embed_methods.py
    python embed_methods.py --force   # re-embed all active methods

Requires:
    pip install asyncpg sentence-transformers python-dotenv
    DATABASE_URL env var set, or a .env file in the working directory.
"""

import argparse
import asyncio
import json
import os
import sys


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------

def load_model():
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("ERROR: sentence-transformers not installed.", file=sys.stderr)
        print("Run: pip install sentence-transformers", file=sys.stderr)
        sys.exit(1)
    print("Loading model (all-MiniLM-L6-v2, ~90 MB)...")
    return SentenceTransformer("all-MiniLM-L6-v2")


def embed(model, text: str) -> list[float]:
    return model.encode(text, normalize_embeddings=True).tolist()


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

async def get_connection(database_url: str):
    try:
        import asyncpg
    except ImportError:
        print("ERROR: asyncpg not installed.", file=sys.stderr)
        print("Run: pip install asyncpg", file=sys.stderr)
        sys.exit(1)

    try:
        conn = await asyncpg.connect(database_url)
    except Exception as e:
        print(f"ERROR: could not connect to database.\n{e}", file=sys.stderr)
        sys.exit(1)

    # Register JSONB codec so we can pass Python lists/dicts directly.
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )
    return conn


async def fetch_methods(conn, force: bool) -> list[dict]:
    if force:
        query = "SELECT id, slug, text_for_embedding FROM methods WHERE active = TRUE"
    else:
        query = (
            "SELECT id, slug, text_for_embedding "
            "FROM methods WHERE active = TRUE AND embedding_json IS NULL"
        )
    rows = await conn.fetch(query)
    return [dict(r) for r in rows]


async def save_embedding(conn, method_id: int, embedding: list[float]) -> None:
    await conn.execute(
        "UPDATE methods SET embedding_json = $1, updated_at = NOW() WHERE id = $2",
        embedding,   # asyncpg serializes list → jsonb via the registered codec
        method_id,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def run(database_url: str, force: bool) -> None:
    conn = await get_connection(database_url)

    try:
        rows = await fetch_methods(conn, force)

        if not rows:
            print(
                "No methods require embedding. "
                "Use --force to re-embed all active methods."
            )
            return

        print(f"Embedding {len(rows)} method(s)...")
        model = load_model()

        for row in rows:
            vector = embed(model, row["text_for_embedding"])
            await save_embedding(conn, row["id"], vector)
            print(f"  ok {row['slug']}")

        print(f"\nDone. {len(rows)} method(s) embedded.")
        print(
            "Verify:\n"
            "  SELECT slug, active, jsonb_array_length(embedding_json) AS dims\n"
            "  FROM methods WHERE active = TRUE ORDER BY slug;"
        )

    finally:
        await conn.close()


def main() -> None:
    # Load .env if present (dev convenience; prod uses real env vars).
    try:
        from dotenv import load_dotenv
        from pathlib import Path

        backend_dir = Path(__file__).resolve().parents[1]
        load_dotenv(backend_dir / ".env")
        load_dotenv(backend_dir.parent / ".env")
    except ImportError:
        pass

    parser = argparse.ArgumentParser(description="Generate method embeddings.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-embed methods that already have an embedding.",
    )
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print(
            "ERROR: DATABASE_URL is not set.\n"
            "Set it as an environment variable or add it to a .env file.",
            file=sys.stderr,
        )
        sys.exit(1)

    asyncio.run(run(database_url, args.force))


if __name__ == "__main__":
    main()
