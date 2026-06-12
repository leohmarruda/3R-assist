from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ThreeRClass = Literal["replacement", "reduction", "refinement"]
Jurisdiction = Literal["brazil", "international", "both"]
ApplicationArea = Literal["pharma", "cosmetics", "chemical_safety", "general"]
ValidationStatus = Literal["validated", "accepted", "emerging"]
SourceDb = Literal["ECVAM_DBALM", "NICEATM", "FARMACOPEIA_BR", "TSAR"]


class Method(BaseModel):
    id: int
    slug: str
    name_en: str
    name_pt: str
    description_en: str
    description_pt: str
    text_for_embedding: str
    category_3r: ThreeRClass
    endpoint_category: str
    application_area: ApplicationArea
    oecd_tg_ref: str | None = None
    source_db: SourceDb
    validation_status: ValidationStatus
    jurisdiction: Jurisdiction
    jurisdiction_notes: str | None = None
    primary_lit_url: str | None = None
    regulatory_url: str | None = None
    routes_applicable: list[str] | None = None
    embedding_json: list[float] | None = None
    active: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MethodKeyword(BaseModel):
    id: int
    method_id: int
    keyword: str
    language: Literal["en", "pt"]
