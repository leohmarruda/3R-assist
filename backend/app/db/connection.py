from __future__ import annotations

import asyncio
import json
from pathlib import Path

import asyncpg
from asyncpg import Connection, Pool

from app.config import get_settings

_MIGRATIONS_DIR = Path(__file__).with_name("migrations")

_pool: Pool | None = None
_pool_lock = asyncio.Lock()


def normalize_database_url(url: str) -> str:
    """Convert SQLAlchemy-style URLs to asyncpg-compatible postgresql:// URLs."""
    if not url:
        raise ValueError("DATABASE_URL is not set.")
    if url.startswith("sqlite"):
        raise ValueError(
            "SQLite is no longer supported. Set DATABASE_URL to a PostgreSQL connection string."
        )
    normalized = url.replace("postgresql+asyncpg://", "postgresql://")
    if normalized.startswith("postgres://"):
        normalized = "postgresql://" + normalized.removeprefix("postgres://")
    return normalized


def split_sql_statements(sql: str) -> list[str]:
    """Split SQL into statements, respecting quotes, comments, and dollar-quoting."""
    statements: list[str] = []
    current: list[str] = []
    in_dollar = False
    in_single = False
    in_line_comment = False
    in_block_comment = False
    i = 0
    n = len(sql)
    while i < n:
        ch = sql[i]
        nxt = sql[i + 1] if i + 1 < n else ""

        if in_line_comment:
            current.append(ch)
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            current.append(ch)
            if ch == "*" and nxt == "/":
                current.append(nxt)
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue

        if not in_dollar and not in_single and ch == "-" and nxt == "-":
            in_line_comment = True
            current.append(ch)
            current.append(nxt)
            i += 2
            continue

        if not in_dollar and not in_single and ch == "/" and nxt == "*":
            in_block_comment = True
            current.append(ch)
            current.append(nxt)
            i += 2
            continue

        if not in_dollar and ch == "'":
            current.append(ch)
            if in_single and nxt == "'":
                current.append(nxt)
                i += 2
                continue
            in_single = not in_single
            i += 1
            continue

        if not in_single and not in_dollar and sql[i : i + 2] == "$$":
            in_dollar = True
            current.append("$$")
            i += 2
            continue
        if in_dollar and sql[i : i + 2] == "$$":
            in_dollar = False
            current.append("$$")
            i += 2
            continue

        if not in_dollar and not in_single and ch == ";":
            stmt = "".join(current).strip()
            if stmt and not _is_comment_only(stmt):
                statements.append(stmt)
            current = []
            i += 1
            continue

        current.append(ch)
        i += 1

    stmt = "".join(current).strip()
    if stmt and not _is_comment_only(stmt):
        statements.append(stmt)
    return statements


def _is_comment_only(stmt: str) -> bool:
    for line in stmt.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("--"):
            return False
    return True


async def register_jsonb_codec(conn: Connection) -> None:
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )


async def _init_connection(conn: Connection) -> None:
    await register_jsonb_codec(conn)


async def create_pool() -> Pool:
    global _pool
    async with _pool_lock:
        if _pool is None:
            dsn = normalize_database_url(get_settings().database_url)
            _pool = await asyncpg.create_pool(
                dsn,
                min_size=1,
                max_size=10,
                init=_init_connection,
            )
        return _pool


async def close_pool() -> None:
    global _pool
    async with _pool_lock:
        if _pool is not None:
            await _pool.close()
            _pool = None


async def get_pool() -> Pool:
    return await create_pool()


async def apply_migrations() -> list[str]:
    """Apply pending SQL migrations. Returns names of newly applied files."""
    dsn = normalize_database_url(get_settings().database_url)
    conn = await asyncpg.connect(dsn)
    try:
        await register_jsonb_codec(conn)
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        applied_rows = await conn.fetch("SELECT filename FROM schema_migrations")
        applied = {row["filename"] for row in applied_rows}

        newly_applied: list[str] = []
        for path in sorted(_MIGRATIONS_DIR.glob("*.sql")):
            name = path.name
            if name in applied:
                continue
            statements = split_sql_statements(path.read_text(encoding="utf-8"))
            async with conn.transaction():
                for index, statement in enumerate(statements, start=1):
                    try:
                        await conn.execute(statement)
                    except Exception as exc:
                        preview = statement[:120].replace("\n", " ")
                        raise RuntimeError(
                            f"{name} statement {index}/{len(statements)} failed: {exc}\n"
                            f"Preview: {preview}..."
                        ) from exc
                await conn.execute(
                    "INSERT INTO schema_migrations (filename) VALUES ($1)",
                    name,
                )
            newly_applied.append(name)

        return newly_applied
    finally:
        await conn.close()
