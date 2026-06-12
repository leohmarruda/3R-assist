import asyncio

from app.adapters.embedder import StubEmbedderAdapter
from app.models.method import Method
from app.models.protocol import ProtocolParameters
from app.repositories.methods import MethodRepository
from app.services.retrieval import RetrievalService, build_query_text, cosine_similarity


def _method(
    slug: str,
    endpoint: str,
    routes: list[str] | None,
    embedding: list[float],
) -> Method:
    return Method(
        id=1,
        slug=slug,
        name_en=slug,
        name_pt=slug,
        description_en="desc",
        description_pt="desc",
        text_for_embedding="text",
        category_3r="reduction",
        endpoint_category=endpoint,
        application_area="general",
        source_db="NICEATM",
        validation_status="validated",
        jurisdiction="both",
        routes_applicable=routes,
        embedding_json=embedding,
        active=True,
    )


class FakeMethodRepository(MethodRepository):
    def __init__(self, methods: list[Method]) -> None:
        self._methods = methods

    async def list_active(self) -> list[Method]:
        return self._methods


def test_build_query_text_includes_matching_fields():
    params = ProtocolParameters(
        endpoint_category="acute_toxicity",
        route=["oral"],
        application_area="general",
        procedure_text="LD50 single dose",
    )
    text = build_query_text(params)
    assert "acute_toxicity" in text
    assert "LD50 single dose" in text
    assert "oral" in text


def test_cosine_similarity_for_identical_vectors():
    vector = [0.5, 0.5, 0.5, 0.5]
    assert cosine_similarity(vector, vector) == 1.0


def test_retrieval_filters_endpoint_and_route():
    embedder = StubEmbedderAdapter()
    oral_vector = embedder.embed("acute_toxicity oral general")
    dermal_vector = embedder.embed("skin_irritation dermal general")

    methods = [
        _method("oral-a", "acute_toxicity", ["oral"], oral_vector),
        _method("oral-b", "acute_toxicity", ["oral"], oral_vector),
        _method("oral-c", "acute_toxicity", ["oral"], oral_vector),
        _method("dermal-a", "skin_irritation", ["dermal"], dermal_vector),
    ]
    service = RetrievalService(FakeMethodRepository(methods), embedder)
    params = ProtocolParameters(
        endpoint_category="acute_toxicity",
        route=["oral"],
        application_area="general",
        procedure_text="LD50",
    )

    recommendations, relaxation = asyncio.run(service.search(params))

    assert relaxation is None
    assert len(recommendations) == 3
    assert all(item.method.endpoint_category == "acute_toxicity" for item in recommendations)


def test_retrieval_relaxes_route_filter_for_minimum_results():
    embedder = StubEmbedderAdapter()
    vector = embedder.embed("acute_toxicity oral general")

    methods = [
        _method("a", "acute_toxicity", ["oral"], vector),
        _method("b", "acute_toxicity", ["oral"], vector),
        _method("c", "acute_toxicity", ["oral"], vector),
    ]
    service = RetrievalService(FakeMethodRepository(methods), embedder)
    params = ProtocolParameters(
        endpoint_category="acute_toxicity",
        route=["intraperitoneal"],
        application_area="general",
    )

    recommendations, relaxation = asyncio.run(service.search(params))

    assert relaxation == "route_filter_relaxed"
    assert len(recommendations) == 3
