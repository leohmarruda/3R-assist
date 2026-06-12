from typing import Literal

from pydantic import BaseModel, Field

from app.models.recommendation import Recommendation

ConfidenceLevel = Literal["high", "medium", "low"]

EndpointCategory = Literal[
    "acute_toxicity",
    "skin_irritation",
    "skin_corrosion",
    "ocular_irritation",
    "skin_sensitisation",
    "phototoxicity",
    "genotoxicity",
    "pyrogenicity",
    "skin_absorption",
]

Route = Literal[
    "oral",
    "intraperitoneal",
    "intravenous",
    "dermal",
    "ocular",
    "inhalation",
    "in_vitro",
]

ApplicationArea = Literal["pharma", "cosmetics", "chemical_safety", "general"]

Species = Literal[
    "rat",
    "mouse",
    "rabbit",
    "guinea_pig",
    "chicken",
    "zebrafish",
    "in_vitro",
    "other",
]

PARAMETER_FIELD_KEYS = (
    "endpoint_category",
    "route",
    "application_area",
    "procedure_text",
    "species",
    "n_animals",
    "regulatory",
)


class ProtocolParameters(BaseModel):
    endpoint_category: EndpointCategory | None = None
    route: list[Route] | None = None
    application_area: ApplicationArea = "general"
    procedure_text: str | None = None
    species: Species | None = None
    n_animals: int | None = None
    regulatory: bool | None = None

    def has_extractable_content(self) -> bool:
        return self.endpoint_category is not None or bool(self.procedure_text)


class AnalyzeRequest(BaseModel):
    protocol_text: str = Field(..., min_length=20, max_length=10000)
    lang: Literal["pt", "en"] | None = None


class FieldConfidence(BaseModel):
    endpoint_category: ConfidenceLevel | None = None
    route: ConfidenceLevel | None = None
    application_area: ConfidenceLevel | None = None
    procedure_text: ConfidenceLevel | None = None
    species: ConfidenceLevel | None = None
    n_animals: ConfidenceLevel | None = None
    regulatory: ConfidenceLevel | None = None


class AnalyzeResponse(BaseModel):
    params: ProtocolParameters
    confidence: ConfidenceLevel
    field_confidence: FieldConfidence
    raw_text_excerpt: str | None = None
    recommendations: list[Recommendation] = Field(default_factory=list)
    filter_relaxation: str | None = None
