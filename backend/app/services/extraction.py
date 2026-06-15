from app.adapters.llm import ExtractionError, LLMAdapter
from app.models.protocol import (
    AnalyzeResponse,
    ExperimentResult,
    ExtractionResult,
    RawExtraction,
    to_protocol_parameters,
)
from app.services.study_type_lookup import map_study_type_to_endpoint


def enrich_raw_extraction(raw: RawExtraction) -> ExtractionResult:
    endpoint_category = map_study_type_to_endpoint(raw.study_type)
    return ExtractionResult(raw=raw, endpoint_category=endpoint_category)


def enrich_raw_experiments(raw_list: list[RawExtraction]) -> list[ExtractionResult]:
    return [enrich_raw_extraction(raw) for raw in raw_list]


def build_analyze_response(experiments: list[ExtractionResult]) -> AnalyzeResponse:
    primary = experiments[0]
    experiment_models = [ExperimentResult.from_extraction(item) for item in experiments]
    return AnalyzeResponse(
        experiments=experiment_models,
        params=to_protocol_parameters(primary),
    )


class ExtractionService:
    def __init__(self, llm: LLMAdapter) -> None:
        self._llm = llm

    def extract(self, protocol_text: str) -> AnalyzeResponse | ExtractionError:
        raw_experiments = self._llm.extract_raw_experiments(protocol_text)
        if isinstance(raw_experiments, ExtractionError):
            return raw_experiments
        experiments = enrich_raw_experiments(raw_experiments)
        if not experiments:
            return ExtractionError()
        return build_analyze_response(experiments)
