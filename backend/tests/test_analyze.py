from fastapi.testclient import TestClient

from app.adapters.llm import StubLLMAdapter
from app.api.deps import get_extraction_service
from app.main import create_app
from app.services.extraction import ExtractionService

SAMPLE_TEXT = (
    "We used Wistar rats to assess acute oral toxicity with a mortality endpoint "
    "under OECD regulatory testing."
)


def test_analyze_returns_parameters():
    app = create_app()
    app.dependency_overrides[get_extraction_service] = lambda: ExtractionService(
        llm=StubLLMAdapter()
    )
    client = TestClient(app)

    response = client.post("/analyze", json={"protocol_text": SAMPLE_TEXT, "lang": "en"})

    assert response.status_code == 200
    data = response.json()
    assert data["confidence"] in {"high", "medium", "low"}
    assert data["params"]["biological_model"] is not None


def test_analyze_rejects_short_text():
    app = create_app()
    client = TestClient(app)

    response = client.post("/analyze", json={"protocol_text": "too short"})

    assert response.status_code == 422


def test_analyze_extraction_failed_envelope():
    app = create_app()
    app.dependency_overrides[get_extraction_service] = lambda: ExtractionService(
        llm=StubLLMAdapter()
    )
    client = TestClient(app)

    response = client.post(
        "/analyze",
        json={
            "protocol_text": "x" * 25,
            "lang": "en",
        },
    )

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "EXTRACTION_FAILED"
