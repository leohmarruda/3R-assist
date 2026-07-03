from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.api.deps import get_admin_repository
from app.api.errors import ErrorEnvelope, error_response
from app.models.admin import (
    AdminCellUpdateRequest,
    AdminCellUpdateResponse,
    AdminColumnCommentUpdateRequest,
    AdminColumnCommentUpdateResponse,
    AdminRowInsertRequest,
    AdminRowInsertResponse,
    AdminRowsDeleteRequest,
    AdminRowsDeleteResponse,
    AdminTableDataResponse,
    AdminTablesResponse,
)
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


@router.post(
    "/tables/{table_name}",
    response_model=AdminRowInsertResponse,
    responses={
        400: {"model": ErrorEnvelope},
        404: {"model": ErrorEnvelope},
        503: {"model": ErrorEnvelope},
    },
)
async def insert_table_row(
    table_name: str,
    body: AdminRowInsertRequest,
    repository: AdminRepository = Depends(get_admin_repository),
) -> AdminRowInsertResponse | JSONResponse:
    try:
        payload = await repository.insert_row(
            table_name,
            values=body.values,
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
            code="INVALID_INSERT",
            message=str(exc),
        )
    except Exception as exc:
        return error_response(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message="Could not insert table row.",
            detail={"type": type(exc).__name__, "reason": str(exc)},
        )
    return AdminRowInsertResponse(**payload)


@router.patch(
    "/tables/{table_name}",
    response_model=AdminCellUpdateResponse,
    responses={
        400: {"model": ErrorEnvelope},
        404: {"model": ErrorEnvelope},
        503: {"model": ErrorEnvelope},
    },
)
async def update_table_cell(
    table_name: str,
    body: AdminCellUpdateRequest,
    repository: AdminRepository = Depends(get_admin_repository),
) -> AdminCellUpdateResponse | JSONResponse:
    try:
        payload = await repository.update_cell(
            table_name,
            primary_key=body.primary_key,
            column=body.column,
            value=body.value,
        )
    except LookupError as exc:
        if str(exc) == "row":
            return error_response(
                status_code=404,
                code="ROW_NOT_FOUND",
                message="Row was not found.",
            )
        return error_response(
            status_code=404,
            code="TABLE_NOT_FOUND",
            message=f"Table '{table_name}' was not found.",
        )
    except ValueError as exc:
        return error_response(
            status_code=400,
            code="INVALID_UPDATE",
            message=str(exc),
        )
    except Exception as exc:
        return error_response(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message="Could not update table data.",
            detail={"type": type(exc).__name__, "reason": str(exc)},
        )
    return AdminCellUpdateResponse(**payload)


@router.delete(
    "/tables/{table_name}",
    response_model=AdminRowsDeleteResponse,
    responses={
        400: {"model": ErrorEnvelope},
        404: {"model": ErrorEnvelope},
        503: {"model": ErrorEnvelope},
    },
)
async def delete_table_rows(
    table_name: str,
    body: AdminRowsDeleteRequest,
    repository: AdminRepository = Depends(get_admin_repository),
) -> AdminRowsDeleteResponse | JSONResponse:
    try:
        payload = await repository.delete_rows(
            table_name,
            rows=body.rows,
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
            code="INVALID_DELETE",
            message=str(exc),
        )
    except Exception as exc:
        return error_response(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message="Could not delete table rows.",
            detail={"type": type(exc).__name__, "reason": str(exc)},
        )
    return AdminRowsDeleteResponse(**payload)


@router.patch(
    "/tables/{table_name}/columns/{column_name}/comment",
    response_model=AdminColumnCommentUpdateResponse,
    responses={
        400: {"model": ErrorEnvelope},
        404: {"model": ErrorEnvelope},
        503: {"model": ErrorEnvelope},
    },
)
async def update_column_comment(
    table_name: str,
    column_name: str,
    body: AdminColumnCommentUpdateRequest,
    repository: AdminRepository = Depends(get_admin_repository),
) -> AdminColumnCommentUpdateResponse | JSONResponse:
    try:
        payload = await repository.update_column_comment(
            table_name,
            column_name,
            comment=body.comment,
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
            code="INVALID_COMMENT",
            message=str(exc),
        )
    except Exception as exc:
        return error_response(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message="Could not update column comment.",
            detail={"type": type(exc).__name__, "reason": str(exc)},
        )
    return AdminColumnCommentUpdateResponse(**payload)
