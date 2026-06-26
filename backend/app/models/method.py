from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

ThreeRClass = Literal["replacement", "reduction", "refinement"]
RegulatoryJurisdiction = Literal["brazil", "eu", "us", "oecd"]
StudyDomain = Literal["pharma", "cosmetics", "chemical_safety", "general"]
ValidationStatus = Literal["validated", "accepted", "emerging"]
SourceDb = Literal["OECD_TG", "ECVAM_DBALM", "NICEATM", "FARMACOPEIA_BR", "TSAR"]


class MethodValidationContext(BaseModel):
    study_domain: StudyDomain
    jurisdiction: RegulatoryJurisdiction
    validation_status: ValidationStatus
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
    category_3r: list[ThreeRClass] = Field(..., min_length=1)
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

    def has_three_r(self, value: ThreeRClass) -> bool:
        return value in self.category_3r

    @property
    def primary_three_r(self) -> ThreeRClass:
        for preferred in ("replacement", "reduction", "refinement"):
            if preferred in self.category_3r:
                return preferred
        return self.category_3r[0]


class MethodKeyword(BaseModel):
    id: int
    method_id: int
    keyword: str
    language: Literal["en", "pt"]
