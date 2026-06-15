"""Shared pytest fixtures for backend tests."""
from __future__ import annotations

import os
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        value = value.split("#", 1)[0].strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), value)


def has_llm_api_key() -> bool:
    return any(
        os.environ.get(name, "").strip()
        for name in ("ANTHROPIC_API_KEY", "OPENROUTER_API_KEY", "OPENAI_API_KEY")
    )


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "live: hits real LLM APIs (requires .env keys)",
    )


def pytest_sessionstart(session: pytest.Session) -> None:
    from tests.extraction_score import reset_session_scores

    reset_session_scores()


def pytest_terminal_summary(
    terminalreporter: pytest.TerminalReporter,
    exitstatus: int,
    config: pytest.Config,
) -> None:
    from tests.extraction_score import (
        build_performance_report,
        format_performance_report,
        get_session_scores,
    )

    scores = get_session_scores()
    if not scores:
        return

    models = sorted({case.model for case in scores})
    for model in models:
        report = build_performance_report(model)
        terminalreporter.write_line(format_performance_report(report))


@pytest.fixture(scope="session", autouse=True)
def _load_project_env() -> None:
    load_env_file(ENV_FILE)


@pytest.fixture
def live_llm_adapter():
    from app.adapters.llm import ExtractionError, build_llm_adapter
    from app.config import get_settings

    if not has_llm_api_key():
        pytest.skip("No LLM API key in .env")

    get_settings.cache_clear()
    settings = get_settings()
    if settings.use_stub_llm:
        pytest.skip("LLM API keys configured but stub mode is active")

    adapter = build_llm_adapter(
        model=settings.resolved_llm_model,
        use_stub=settings.use_stub_llm,
    )
    yield adapter, settings.resolved_llm_model

    get_settings.cache_clear()
