from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.api.deps import get_admin_repository
from app.api.errors import ErrorEnvelope, error_response
from app.models.admin import AdminTableDataResponse, AdminTablesResponse
from app.repositories.admin import AdminRepository

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/tables", response_model=AdminTablesResponse)
async def list_tables(
    repository: AdminRepository = Depends(get_admin_repository),
) -> AdminTablesResponse | JSONResponse:
    try:
        tables = await repository.list_tables()
    except ValueError as exc:
        return error_response(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message=str(exc),
        )
    except Exception as exc:
        return error_response(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message="Could not load database tables.",
            detail={"type": type(exc).__name__, "reason": str(exc)},
        )
    return AdminTablesResponse(tables=tables)


@router.get(
    "/tables/{table_name}",
    response_model=AdminTableDataResponse,
    responses={404: {"model": ErrorEnvelope}, 503: {"model": ErrorEnvelope}},
)
async def get_table_data(
    table_name: str,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    repository: AdminRepository = Depends(get_admin_repository),
) -> AdminTableDataResponse | JSONResponse:
    try:
        payload = await repository.fetch_table(
            table_name,
            limit=limit,
            offset=offset,
        )
    except LookupError:
        return error_response(
            status_code=404,
            code="TABLE_NOT_FOUND",
            message=f"Table '{table_name}' was not found.",
        )
    except ValueError as exc:
        return error_response(
            status_code=400,
            code="INVALID_TABLE",
            message=str(exc),
        )
    except Exception as exc:
        return error_response(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message="Could not load table data.",
            detail={"type": type(exc).__name__},
        )
    return AdminTableDataResponse(**payload)
