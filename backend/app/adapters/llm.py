from __future__ import annotations

import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal

from app.models.protocol import (
    ConfidenceLevel,
    FieldConfidence,
    PARAMETER_FIELD_KEYS,
    ProtocolParameters,
)

EXTRACTION_SYSTEM_PROMPT = """Extract experimental protocol parameters from the user's text.
Return JSON only with keys: biological_model, objective, procedure, endpoint, application_area.
Use null for unknown fields. Do not invent values not supported by the text."""


@dataclass(frozen=True)
class ExtractionError:
    code: Literal["EXTRACTION_FAILED"] = "EXTRACTION_FAILED"
    message: str = "Could not extract parameters from the provided text."


@dataclass
class ExtractionResult:
    params: ProtocolParameters
    confidence: ConfidenceLevel
    field_confidence: FieldConfidence


class LLMAdapter(ABC):
    @abstractmethod
    def extract_parameters(self, text: str) -> ExtractionResult | ExtractionError:
        pass


def confidence_from_params(params: ProtocolParameters) -> ConfidenceLevel:
    filled = params.filled_count()
    if filled >= 4:
        return "high"
    if filled >= 2:
        return "medium"
    return "low"


def field_confidence_from_params(params: ProtocolParameters) -> FieldConfidence:
    values = {
        key: getattr(params, key)
        for key in PARAMETER_FIELD_KEYS
    }
    return FieldConfidence(
        **{
            key: "high" if values[key] else "low"
            for key in PARAMETER_FIELD_KEYS
        }
    )


class StubLLMAdapter(LLMAdapter):
    """Heuristic extractor for local dev without an Anthropic API key."""

    _MODEL_PATTERNS = (
        (r"\b(wistar|sprague[- ]dawley|sd)\s+rat(s)?\b", "Rattus norvegicus (Wistar rat)"),
        (r"\bcamundong\w*\b|\bmice\b|\bmouse\b|\bmus\s+musculus\b", "Mus musculus"),
        (r"\brat(s)?\b|\brattus\b", "Rattus norvegicus"),
        (r"\brabbit(s)?\b|\bcoelho(s)?\b", "Oryctolagus cuniculus"),
    )

    _OBJECTIVE_PATTERNS = (
        (r"toxicidade|toxicity|tóxic", "Toxicity assessment"),
        (r"vacina|vaccine|potency|potência", "Vaccine potency / efficacy"),
        (r"neuro|desenvolvimento|development", "Neurological development"),
    )

    _PROCEDURE_PATTERNS = (
        (r"oral|gavage|gavagem|via oral", "Oral gavage"),
        (r"inala\w*|inhalation", "Inhalation"),
        (r"intraperitoneal|\bip\b", "Intraperitoneal injection"),
    )

    _ENDPOINT_PATTERNS = (
        (r"ld50|lethal|letal|morte|mortality", "Lethal dose / mortality"),
        (r"genotox|mutagen", "Genotoxicity"),
        (r"acute|aguda", "Acute toxicity"),
    )

    _AREA_PATTERNS = (
        (r"regulat\w*|oecd|concea|ecvam", "Regulatory safety testing"),
        (r"pesquisa|research|básic", "Basic research"),
    )

    def extract_parameters(self, text: str) -> ExtractionResult | ExtractionError:
        normalized = text.strip()
        if len(normalized) < 20:
            return ExtractionError(message="Protocol text is too short to extract parameters.")

        params = ProtocolParameters(
            biological_model=self._first_match(normalized, self._MODEL_PATTERNS),
            objective=self._first_match(normalized, self._OBJECTIVE_PATTERNS),
            procedure=self._first_match(normalized, self._PROCEDURE_PATTERNS),
            endpoint=self._first_match(normalized, self._ENDPOINT_PATTERNS),
            application_area=self._first_match(normalized, self._AREA_PATTERNS),
        )

        if params.filled_count() == 0:
            return ExtractionError()

        return ExtractionResult(
            params=params,
            confidence=confidence_from_params(params),
            field_confidence=field_confidence_from_params(params),
        )

    @staticmethod
    def _first_match(text: str, patterns: tuple[tuple[str, str], ...]) -> str | None:
        lowered = text.lower()
        for pattern, value in patterns:
            if re.search(pattern, lowered, flags=re.IGNORECASE):
                return value
        return None


class AnthropicLLMAdapter(LLMAdapter):
    def __init__(self, api_key: str, model: str) -> None:
        self._api_key = api_key
        self._model = model

    def extract_parameters(self, text: str) -> ExtractionResult | ExtractionError:
        try:
            import anthropic
        except ImportError:
            return ExtractionError(message="anthropic package is not installed.")

        client = anthropic.Anthropic(api_key=self._api_key)
        try:
            response = client.messages.create(
                model=self._model,
                max_tokens=1024,
                system=EXTRACTION_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": text}],
            )
        except Exception:
            return ExtractionError()

        raw = response.content[0].text if response.content else ""
        try:
            payload = json.loads(raw)
            params = ProtocolParameters.model_validate(payload)
        except (json.JSONDecodeError, ValueError):
            return ExtractionError()

        if params.filled_count() == 0:
            return ExtractionError()

        return ExtractionResult(
            params=params,
            confidence=confidence_from_params(params),
            field_confidence=field_confidence_from_params(params),
        )


def build_llm_adapter(*, api_key: str | None, model: str) -> LLMAdapter:
    if api_key:
        return AnthropicLLMAdapter(api_key=api_key, model=model)
    return StubLLMAdapter()
