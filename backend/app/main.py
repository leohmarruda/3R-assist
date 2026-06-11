import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Garante que o Vercel consiga encontrar o módulo 'app' adicionando a raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.errors import unhandled_exception_handler
from app.api.routes import analysis, health
from app.config import get_settings
from app.db.connection import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # CRUCIAL: Só tenta inicializar o banco local se NÃO estiver no Vercel
    # Evita travar o container read-only com escritas do SQLite local
    if os.getenv("VERCEL") is None:
        try:
            init_db()
        except Exception as e:
            print(f"Erro ao inicializar banco local: {e}")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    
    # Adiciona fallback para evitar que configurações ausentes quebrem o app
    app = FastAPI(
        title="3R Assist API",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Configuração do CORS dinâmica baseada nas configurações
    cors_origins = settings.cors_origin_list if hasattr(settings, 'cors_origin_list') else ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(Exception, unhandled_exception_handler)

    app.include_router(health.router)
    app.include_router(analysis.router)

    return app


app = create_app()