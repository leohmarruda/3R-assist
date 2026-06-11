from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.config import get_settings

_SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def _ensure_sqlite_parent_dir(database_url: str) -> None:
    if database_url.startswith("sqlite:///./"):
        relative = database_url.removeprefix("sqlite:///./")
        Path(relative).parent.mkdir(parents=True, exist_ok=True)


def create_db_engine() -> Engine:
    settings = get_settings()
    _ensure_sqlite_parent_dir(settings.database_url)
    connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
    return create_engine(settings.database_url, connect_args=connect_args)


def init_db(engine: Engine | None = None) -> None:
    engine = engine or create_db_engine()
    schema = _SCHEMA_PATH.read_text(encoding="utf-8")
    with engine.begin() as conn:
        for statement in schema.split(";"):
            sql = statement.strip()
            if sql:
                conn.execute(text(sql))
