from typing import Any

from pydantic import BaseModel, Field


class AdminTablesResponse(BaseModel):
    tables: list[str]


class AdminTableDataResponse(BaseModel):
    table: str
    columns: list[str]
    rows: list[dict[str, Any]]
    total: int
    limit: int
    offset: int = 0


class AdminTableQuery(BaseModel):
    limit: int = Field(default=100, ge=1, le=500)
    offset: int = Field(default=0, ge=0)
