#!/usr/bin/env python3
"""Apply pending database migrations from backend/app/db/migrations/."""

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

from app.db.connection import apply_migrations


async def main() -> int:
    try:
        applied = await apply_migrations()
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"ERROR: migration failed: {exc}", file=sys.stderr)
        return 1

    if not applied:
        print("No pending migrations.")
    else:
        for name in applied:
            print(f"Applied: {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
