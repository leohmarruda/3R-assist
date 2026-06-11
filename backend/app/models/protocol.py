from typing import Literal

from pydantic import BaseModel, Field

ConfidenceLevel = Literal["high", "medium", "low"]


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
    protocol_text: str = Field(..., min_length=20, max_length=5000)
    lang: Literal["pt", "en"] | None = None


class AnalyzeResponse(BaseModel):
    params: ProtocolParameters
    confidence: ConfidenceLevel
