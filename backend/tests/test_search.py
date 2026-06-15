from fastapi.testclient import TestClient

from app.adapters.embedder import StubEmbedderAdapter
from app.api.deps import get_retrieval_service
from app.main import create_app
from app.models.method import Method
from app.repositories.methods import MethodRepository
from app.services.retrieval import RetrievalService


def _method(
    slug: str,
    endpoint: str,
    routes: list[str] | None,
    *,
    category_3r: str = "replacement",
    jurisdiction: str = "both",
) -> Method:
    return Method(
        id=1,
        slug=slug,
        name_en=f"{slug} EN",
        name_pt=f"{slug} PT",
        description_en="desc",
        description_pt="desc",
        text_for_embedding="acute oral LD50",
        category_3r=category_3r,
        endpoint_category=endpoint,
        application_area="general",
        source_db="NICEATM",
        validation_status="validated",
        jurisdiction=jurisdiction,
        routes_applicable=routes,
        active=True,
    )


class FakeMethodRepository(MethodRepository):
    def __init__(self, methods: list[Method]) -> None:
        self._methods = methods

    async def list_active(self) -> list[Method]:
        return self._methods


def _search_client(methods: list[Method]) -> TestClient:
    service = RetrievalService(
        FakeMethodRepository(methods),
        StubEmbedderAdapter(),
        semantic_ranking=False,
    )
    app = create_app()
    app.dependency_overrides[get_retrieval_service] = lambda: service
    return TestClient(app)


def test_search_returns_ranked_recommendations():
    methods = [
        _method("oral-a", "acute_toxicity", ["oral"]),
        _method("oral-b", "acute_toxicity", ["oral"]),
        _method("oral-c", "acute_toxicity", ["oral"]),
    ]
    client = _search_client(methods)

    response = client.post(
        "/search",
        json={
            "params": {
                "endpoint_category": "acute_toxicity",
                "route": ["oral"],
                "application_area": "general",
                "procedure_text": "LD50 single dose",
            }
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 3
    assert data["results"][0]["rank"] == 1
    assert data["results"][0]["method"]["slug"] == "oral-a"
    assert data["results"][0]["score"] > 0


def test_search_applies_three_r_filter():
    methods = [
        _method("replace", "acute_toxicity", ["oral"], category_3r="replacement"),
        _method("reduce", "acute_toxicity", ["oral"], category_3r="reduction"),
        _method("refine", "acute_toxicity", ["oral"], category_3r="refinement"),
    ]
    client = _search_client(methods)

    response = client.post(
        "/search",
        json={
            "params": {
                "endpoint_category": "acute_toxicity",
                "route": ["oral"],
                "application_area": "general",
            },
            "filters": {"three_r_class": "replacement"},
        },
    )

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 1
    assert results[0]["method"]["category_3r"] == "replacement"


def test_search_without_database_returns_503(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "")
    from app.config import get_settings

    get_settings.cache_clear()

    app = create_app()
    client = TestClient(app)
    response = client.post(
        "/search",
        json={
            "params": {
                "endpoint_category": "acute_toxicity",
                "application_area": "general",
            }
        },
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "DATABASE_UNAVAILABLE"

    get_settings.cache_clear()
