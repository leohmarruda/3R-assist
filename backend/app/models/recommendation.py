from pydantic import BaseModel, Field

from app.models.method import Method, MethodValidationContext


class Recommendation(BaseModel):
    method: Method
    validation_contexts: list[MethodValidationContext] = Field(default_factory=list)
    rank: int
    score: float
    matched_params: list[str]
