from app.adapters.llm import ExtractionError, ExtractionResult, LLMAdapter
from app.models.protocol import AnalyzeResponse


class ExtractionService:
    def __init__(self, llm: LLMAdapter) -> None:
        self._llm = llm

    def extract(self, protocol_text: str) -> AnalyzeResponse | ExtractionError:
        result = self._llm.extract_parameters(protocol_text)
        if isinstance(result, ExtractionError):
            return result
        return AnalyzeResponse(
            params=result.params,
            confidence=result.confidence,
            field_confidence=result.field_confidence,
        )
