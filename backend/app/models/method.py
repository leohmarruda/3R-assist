from typing import Literal

from pydantic import BaseModel

ThreeRClass = Literal["replacement", "reduction", "refinement"]
Jurisdiction = Literal["brazil", "international", "both"]


class Method(BaseModel):
    id: str
    name: str
    description: str
    three_r_class: ThreeRClass
    endpoint: str | None = None
    application_area: str | None = None
    jurisdiction: Jurisdiction
    source_urls: list[str]
    validation_status: str | None = None
