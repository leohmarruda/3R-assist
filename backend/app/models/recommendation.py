from pydantic import BaseModel

from app.models.method import Method


class Recommendation(BaseModel):
    method: Method
    rank: int
    score: float
    matched_params: list[str]
