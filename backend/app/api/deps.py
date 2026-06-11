from functools import lru_cache

from app.adapters.llm import LLMAdapter, build_llm_adapter
from app.config import get_settings
from app.services.extraction import ExtractionService


@lru_cache
def get_llm_adapter() -> LLMAdapter:
    settings = get_settings()
    return build_llm_adapter(api_key=settings.anthropic_api_key, model=settings.anthropic_model)


def get_extraction_service() -> ExtractionService:
    return ExtractionService(llm=get_llm_adapter())
