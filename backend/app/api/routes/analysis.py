import logging

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.adapters.llm import ExtractionError
from app.api.deps import get_extraction_service, get_retrieval_service
from app.api.errors import ErrorEnvelope, error_response
from app.config import get_settings
from app.models.protocol import AnalyzeRequest, AnalyzeResponse
from app.services.extraction import ExtractionService
from app.services.retrieval import RetrievalService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["analysis"])


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses={422: {"model": ErrorEnvelope}},
)
async def analyze_protocol(
    payload: AnalyzeRequest,
    extraction: ExtractionService = Depends(get_extraction_service),
    retrieval: RetrievalService = Depends(get_retrieval_service),
) -> AnalyzeResponse | JSONResponse:
    result = extraction.extract(payload.protocol_text)
    if isinstance(result, ExtractionError):
        return error_response(
            status_code=422,
            code=result.code,
            message=result.message,
        )

    recommendations = []
    filter_relaxation = None
    if get_settings().database_url:
        try:
            recommendations, filter_relaxation = await retrieval.search(result.params)
        except Exception as exc:
            logger.warning("Retrieval skipped: %s", exc)

    return AnalyzeResponse(
        params=result.params,
        confidence=result.confidence,
        field_confidence=result.field_confidence,
        raw_text_excerpt=result.raw_text_excerpt,
        recommendations=recommendations,
        filter_relaxation=filter_relaxation,
    )
