from abc import ABC, abstractmethod


class EmbedderAdapter(ABC):
    @abstractmethod
    def embed(self, text: str) -> list[float]:
        pass

    @abstractmethod
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        pass


class StubEmbedderAdapter(EmbedderAdapter):
    """Placeholder until sentence-transformers is wired in Phase 1 retrieval."""

    def embed(self, text: str) -> list[float]:
        raise NotImplementedError("Embedding not implemented in scaffold.")

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError("Embedding not implemented in scaffold.")
