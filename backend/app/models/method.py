from datetime import datetime
from typing import Literal

from pydantic import BaseModel, computed_field

ThreeRClass = Literal["replacement", "reduction", "refinement"]
RegulatoryJurisdiction = Literal["brazil", "eu", "us", "oecd"]
StudyDomain = Literal["pharma", "cosmetics", "chemical_safety", "general"]
ValidationStatus = Literal["validated", "accepted", "emerging"]
RegulatoryStatus = Literal["not_approved", "approved", "recommended", "mandatory"]
SourceDb = Literal["OECD_TG", "ECVAM_DBALM", "NICEATM", "FARMACOPEIA_BR", "TSAR"]

_THREE_R_ORDER: tuple[ThreeRClass, ...] = ("replacement", "reduction", "refinement")


class MethodValidationContext(BaseModel):
    study_domain: StudyDomain
    jurisdiction: RegulatoryJurisdiction
    validation_status: ValidationStatus
    purpose: str | None = None
    regulatory_status: RegulatoryStatus | None = None
    regulatory_body: str | None = None
    regulatory_ref: str | None = None
    regulatory_url: str | None = None
    notes: str | None = None


class Method(BaseModel):
    id: int
    slug: str
    name_en: str
    name_pt: str
    description_en: str
    description_pt: str
    text_for_embedding: str
    replacement_rationale: str | None = None
    reduction_rationale: str | None = None
    refinement_rationale: str | None = None
    endpoint_category: str
    study_domain: StudyDomain
    oecd_tg_ref: str | None = None
    ncit_id: str | None = None
    source_db: SourceDb
    routes_applicable: list[str] | None = None
    embedding_json: list[float] | None = None
    active: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @staticmethod
    def _nonempty(value: str | None) -> bool:
        return value is not None and value.strip() != ""

    def rationale_for(self, value: ThreeRClass) -> str | None:
        field = f"{value}_rationale"
        text = getattr(self, field)
        return text if self._nonempty(text) else None

    def has_three_r(self, value: ThreeRClass) -> bool:
        return self.rationale_for(value) is not None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def category_3r(self) -> list[ThreeRClass]:
        """Derived from non-null/non-empty rationale columns (ADR-023)."""
        return [r for r in _THREE_R_ORDER if self.has_three_r(r)]

    @property
    def primary_three_r(self) -> ThreeRClass:
        for preferred in _THREE_R_ORDER:
            if self.has_three_r(preferred):
                return preferred
        return "replacement"


class MethodKeyword(BaseModel):
    id: int
    method_id: int
    keyword: str
    language: Literal["en", "pt"]
