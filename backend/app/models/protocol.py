from typing import Literal

from pydantic import BaseModel, Field

ConfidenceLevel = Literal["high", "medium", "low"]

PARAMETER_FIELD_KEYS = (
    "biological_model",
    "objective",
    "procedure",
    "endpoint",
    "application_area",
)


class ProtocolParameters(BaseModel):
    biological_model: str | None = None
    objective: str | None = None
    procedure: str | None = None
    endpoint: str | None = None
    application_area: str | None = None

    def filled_count(self) -> int:
        return sum(
            1
            for value in (
                self.biological_model,
                self.objective,
                self.procedure,
                self.endpoint,
                self.application_area,
            )
            if value
        )


class AnalyzeRequest(BaseModel):
    protocol_text: str = Field(..., min_length=20, max_length=10000)
    lang: Literal["pt", "en"] | None = None


class FieldConfidence(BaseModel):
    biological_model: ConfidenceLevel | None = None
    objective: ConfidenceLevel | None = None
    procedure: ConfidenceLevel | None = None
    endpoint: ConfidenceLevel | None = None
    application_area: ConfidenceLevel | None = None


class AnalyzeResponse(BaseModel):
    params: ProtocolParameters
    confidence: ConfidenceLevel
    field_confidence: FieldConfidence
