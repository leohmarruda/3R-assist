from __future__ import annotations

import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal

from app.models.protocol import (
    ApplicationArea,
    ConfidenceLevel,
    EndpointCategory,
    FieldConfidence,
    PARAMETER_FIELD_KEYS,
    ProtocolParameters,
    Route,
    Species,
)

EXTRACTION_SYSTEM_PROMPT = """You are a scientific assistant specializing in animal research ethics.
Extract experimental parameters from the protocol description below.

Return ONLY valid JSON with these exact fields:
{
  "endpoint_category": one of [acute_toxicity, skin_irritation, skin_corrosion,
    ocular_irritation, skin_sensitisation, phototoxicity, genotoxicity,
    pyrogenicity, skin_absorption] or null if not determinable,
  "route": array of strings from [oral, intraperitoneal, intravenous, dermal,
    ocular, inhalation, in_vitro] or null if not mentioned,
  "application_area": one of [pharma, cosmetics, chemical_safety, general],
  "procedure_text": brief English description of the procedure (max 30 words) or null,
  "species": one of [rat, mouse, rabbit, guinea_pig, chicken, zebrafish,
    in_vitro, other] or null,
  "n_animals": integer or null,
  "regulatory": true/false or null,
  "confidence": "high" if 4+ fields extracted with certainty,
    "medium" if 2-3 fields uncertain, "low" if endpoint_category is null,
  "raw_text_excerpt": 1-2 sentence excerpt that best supports endpoint_category
}

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
    raw_text_excerpt: str | None = None


class LLMAdapter(ABC):
    @abstractmethod
    def extract_parameters(self, text: str) -> ExtractionResult | ExtractionError:
        pass


def _field_has_value(key: str, params: ProtocolParameters) -> bool:
    value = getattr(params, key)
    if key == "route":
        return bool(value)
    if key == "application_area":
        return value is not None
    return value is not None and value != ""


def confidence_from_params(params: ProtocolParameters) -> ConfidenceLevel:
    if params.endpoint_category is None:
        return "low"
    matching = sum(
        _field_has_value(key, params)
        for key in ("endpoint_category", "route", "application_area", "procedure_text")
    )
    display = sum(
        _field_has_value(key, params)
        for key in ("species", "n_animals", "regulatory")
    )
    if matching >= 3 and matching + display >= 4:
        return "high"
    if matching + display >= 2:
        return "medium"
    return "low"


def field_confidence_from_params(params: ProtocolParameters) -> FieldConfidence:
    return FieldConfidence(
        **{
            key: "high" if _field_has_value(key, params) else "low"
            for key in PARAMETER_FIELD_KEYS
        }
    )


class StubLLMAdapter(LLMAdapter):
    """Heuristic extractor aligned with docs/parameter_model.md."""

    def extract_parameters(self, text: str) -> ExtractionResult | ExtractionError:
        normalized = text.strip()
        if len(normalized) < 20:
            return ExtractionError(message="Protocol text is too short to extract parameters.")

        lowered = normalized.lower()
        endpoint = self._extract_endpoint(lowered)
        routes = self._extract_routes(lowered)
        species = self._extract_species(lowered)
        n_animals = self._extract_n_animals(lowered)
        regulatory = self._extract_regulatory(lowered)
        application_area = self._extract_application_area(lowered)
        procedure_text = self._extract_procedure_text(normalized, endpoint)
        raw_excerpt = self._extract_excerpt(normalized)

        params = ProtocolParameters(
            endpoint_category=endpoint,
            route=routes,
            application_area=application_area,
            procedure_text=procedure_text,
            species=species,
            n_animals=n_animals,
            regulatory=regulatory,
        )

        if not params.has_extractable_content():
            return ExtractionError()

        return ExtractionResult(
            params=params,
            confidence=confidence_from_params(params),
            field_confidence=field_confidence_from_params(params),
            raw_text_excerpt=raw_excerpt,
        )

    @staticmethod
    def _extract_endpoint(text: str) -> EndpointCategory | None:
        if re.search(r"ld50|dose letal|lethal dose|acute tox|toxicity study", text):
            return "acute_toxicity"
        if re.search(r"genotox|mutagen|micronucle|ames", text):
            return "genotoxicity"
        if re.search(r"skin sensiti|alergeni|llna|patch test", text):
            return "skin_sensitisation"
        if re.search(r"ocular|conjunctiv|eye irrit|draize.*eye", text):
            return "ocular_irritation"
        if re.search(r"skin irrit|dermal irrit", text):
            return "skin_irritation"
        if re.search(r"skin corrosion|corrosão cut", text):
            return "skin_corrosion"
        if re.search(r"phototox|3t3 nru", text):
            return "phototoxicity"
        if re.search(r"pyrogen|endotoxin|mat\b", text):
            return "pyrogenicity"
        if re.search(r"skin absorption|penetração dérm", text):
            return "skin_absorption"
        return None

    @staticmethod
    def _extract_routes(text: str) -> list[Route] | None:
        routes: list[Route] = []
        if re.search(r"\bp\.?\s*o\.?\b|oral|gavage|gavagem|intrag[aá]stric", text):
            routes.append("oral")
        if re.search(r"\bi\.?\s*p\.?\b|intraperitoneal", text):
            routes.append("intraperitoneal")
        if re.search(r"\bi\.?\s*v\.?\b|intravenous|endovenos", text):
            routes.append("intravenous")
        if re.search(r"dermal|cut[aâ]ne|t[oó]pic|epicut", text):
            routes.append("dermal")
        if re.search(r"ocular|conjunctiv", text):
            routes.append("ocular")
        if re.search(r"inala|inhalation|aerossol|respirat", text):
            routes.append("inhalation")
        if re.search(r"in vitro|cultura celular|c[eé]lulas", text):
            routes.append("in_vitro")
        return routes or None

    @staticmethod
    def _extract_species(text: str) -> Species | None:
        if re.search(r"wistar|sprague|dawley|\brat(s)?\b|rattus", text):
            return "rat"
        if re.search(r"camundong|mouse|mice|mus musculus|balb/c", text):
            return "mouse"
        if re.search(r"rabbit|coelho|cuniculus", text):
            return "rabbit"
        if re.search(r"guinea pig|cobaia|porcellus", text):
            return "guinea_pig"
        if re.search(r"chicken|galinha|gallus", text):
            return "chicken"
        if re.search(r"zebrafish|peixe-zebra|danio", text):
            return "zebrafish"
        if re.search(r"in vitro|cultura celular", text):
            return "in_vitro"
        return None

    @staticmethod
    def _extract_n_animals(text: str) -> int | None:
        patterns = (
            r"(\d+)\s+(?:male\s+)?(?:female\s+)?wistar\s+rat",
            r"total of\s+(\d+)\s+(?:male\s+)?rat",
            r"(\d+)\s+(?:male\s+)?(?:female\s+)?rat",
            r"(\d+)\s+animals?",
        )
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                return int(match.group(1))
        return None

    @staticmethod
    def _extract_regulatory(text: str) -> bool | None:
        if re.search(
            r"oecd|ecvam|concea|regulatory|directive|ethical committee|"
            r"food safety agency|86/609",
            text,
        ):
            return True
        if re.search(r"non-regulatory|basic research only", text):
            return False
        return None

    @staticmethod
    def _extract_application_area(text: str) -> ApplicationArea:
        if re.search(r"vaccine|pharma|medicinal|drug safety", text):
            return "pharma"
        if re.search(r"cosmetic|higiene pessoal", text):
            return "cosmetics"
        if re.search(
            r"chemical|agrot[oó]x|industrial|essential oil|plant extract|subst[aâ]ncia",
            text,
        ):
            return "chemical_safety"
        return "general"

    @staticmethod
    def _extract_procedure_text(text: str, endpoint: EndpointCategory | None) -> str | None:
        if endpoint == "acute_toxicity" and re.search(r"ld50|litchfield|wilcoxon", text, re.I):
            return "Single-dose acute toxicity LD50 Litchfield-Wilcoxon"
        if endpoint == "acute_toxicity":
            return "Single-dose acute toxicity"
        match = re.search(
            r"(single-dose[^.]{0,80}|28-day[^.]{0,80}|repeated dose[^.]{0,80})",
            text,
            re.IGNORECASE,
        )
        return match.group(1).strip() if match else None

    @staticmethod
    def _extract_excerpt(text: str) -> str | None:
        for pattern in (
            r"Acute Toxicity Study[^.]*\.",
            r"Single-dose acute toxicity[^.]*\.",
            r"LD50[^.]*\.",
        ):
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return sentences[0][:240] if sentences else None


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
            confidence = payload.pop("confidence", None)
            raw_text_excerpt = payload.pop("raw_text_excerpt", None)
            params = ProtocolParameters.model_validate(payload)
        except (json.JSONDecodeError, ValueError):
            return ExtractionError()

        if not params.has_extractable_content():
            return ExtractionError()

        resolved_confidence = confidence or confidence_from_params(params)
        return ExtractionResult(
            params=params,
            confidence=resolved_confidence,
            field_confidence=field_confidence_from_params(params),
            raw_text_excerpt=raw_text_excerpt,
        )


def build_llm_adapter(*, api_key: str | None, model: str) -> LLMAdapter:
    if api_key:
        return AnthropicLLMAdapter(api_key=api_key, model=model)
    return StubLLMAdapter()
