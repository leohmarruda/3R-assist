from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorBody(BaseModel):
    code: str
    message: str
    detail: dict[str, Any] = {}


class ErrorEnvelope(BaseModel):
    error: ErrorBody


def error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    detail: dict[str, Any] | None = None,
) -> JSONResponse:
    payload = ErrorEnvelope(
        error=ErrorBody(code=code, message=message, detail=detail or {})
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump())


async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    return error_response(
        status_code=500,
        code="INTERNAL_ERROR",
        message="An unexpected error occurred.",
        detail={"type": type(exc).__name__},
    )
