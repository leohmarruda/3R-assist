# Parameter Model — 3R Assist
> Version: MVP (Phase 1–2)
> Owner: Leo (implementation) · Karynn (vocabulary validation)
> Reference: spec.md §2.3 S2, §2.11 POST /analyze; decisions.md ADR-007

---

## 1. Propósito

Este documento define o contrato entre três componentes:
1. **ExtractionService** — o que o LLM extrai de um protocolo livre
2. **S2 (Parameter Review Screen)** — o que o usuário vê e pode corrigir
3. **RetrievalService** — o que alimenta filtros e embeddings para matching

Qualquer alteração neste modelo é uma mudança de interface, não de implementação.
Registrar como ADR se afetar o contrato do `POST /analyze`.

---

## 2. Campos e função de cada um

| Campo | Tipo | Obrigatório | Camada | Função |
|---|---|---|---|---|
| `endpoint_category` | enum (ver §3.1) | sim | **matching** | Hard filter — só retorna métodos com o mesmo endpoint |
| `route` | enum (ver §3.2), nullable | não | **matching** | Soft filter — exclui métodos com via incompatível |
| `application_area` | enum (ver §3.3) | sim | **matching** | Soft filter — prioriza métodos do mesmo contexto |
| `procedure_text` | string livre | não | **matching** | Concatenado ao embedding do protocolo |
| `species` | enum (ver §3.4), nullable | não | **display** | Exibido no S2; contexto para o usuário |
| `n_animals` | integer, nullable | não | **display** | Exibido no S2; contexto para o usuário |
| `regulatory` | boolean, nullable | não | **display** | Exibido no S2; contexto para o usuário |

Regra geral: campos **matching** são normalizados para valores de vocabulário controlado.
Campos **display** são extraídos em linguagem natural e exibidos sem normalização forçada.

---

## 3. Vocabulários controlados

### 3.1 `endpoint_category`

Vocabulário compartilhado entre o modelo de extração e a tabela `methods`.
O LLM deve mapear a descrição do protocolo para um desses valores.
Se o protocolo não se encaixar em nenhum: `null` (o usuário corrige no S2).

| Valor | Engloba | Métodos no banco (TG) |
|---|---|---|
| `acute_toxicity` | toxicidade aguda oral/ip/iv, LD50, DL50, classe tóxica | 420, 423, 425, GD129 |
| `skin_irritation` | irritação cutânea, dermal irritation, Draize pele | 439 |
| `skin_corrosion` | corrosão cutânea, dermal corrosion | 430, 431, 435 |
| `ocular_irritation` | irritação ocular, Draize olho, eye irritation | 437, 438, 460 |
| `skin_sensitisation` | sensibilização cutânea, alergenicidade, LLNA | 429, 442A, 442B, 442C, 442D, 442E |
| `phototoxicity` | fototoxicidade, photoirritation, 3T3 NRU | 432 |
| `genotoxicity` | genotoxicidade, mutagenicidade, micronúcleo, Ames | 471, 476, 487 |
| `pyrogenicity` | pirogenicidade, pirogênio, endotoxina, MAT | MAT |
| `skin_absorption` | absorção cutânea, penetração dérmica | 428 |

Sinônimos comuns para instrução ao LLM:
- "teste de Draize" sem especificação → `null` (ambíguo: olho ou pele?)
- "DL50", "dose letal", "LC50 oral" → `acute_toxicity`
- "sensibilização", "alergenicidade", "patch test" → `skin_sensitisation`
- "irritação ocular", "conjuntival" → `ocular_irritation`
- "genotox", "mutagênese", "clastogenicidade" → `genotoxicity`

### 3.2 `route`

Via de administração ou exposição do protocolo.
Usado para filtrar métodos incompatíveis.

| Valor | Sinônimos | Métodos compatíveis (endpoint_category) |
|---|---|---|
| `oral` | p.o., gavagem, intragástrico, oral | acute_toxicity |
| `intraperitoneal` | i.p. | acute_toxicity |
| `intravenous` | i.v., endovenoso | acute_toxicity |
| `dermal` | tópico, cutâneo, epitelial, epicutâneo | skin_irritation, skin_corrosion, skin_sensitisation, skin_absorption, phototoxicity |
| `ocular` | ocular, conjuntival, instilação ocular | ocular_irritation |
| `inhalation` | inalação, respiratório, aerossol | (sem métodos no banco MVP) |
| `in_vitro` | in vitro, cultura celular, células | genotoxicity, phototoxicity |

Quando o protocolo usa múltiplas vias (ex: `p.o. / i.p.`):
→ Extrair como array: `["oral", "intraperitoneal"]`
→ O RetrievalService inclui métodos compatíveis com QUALQUER das vias listadas

Quando `route` é `null`:
→ Sem filtro de via; o RetrievalService retorna todos os métodos do endpoint

### 3.3 `application_area`

Contexto de uso do protocolo. Determina relevância de indicadores de jurisdição.

| Valor | Quando usar |
|---|---|
| `pharma` | segurança farmacêutica, testes regulatórios de medicamentos, vacinas |
| `cosmetics` | cosméticos, produtos de higiene pessoal |
| `chemical_safety` | substâncias químicas, agrotóxicos, produtos industriais |
| `general` | pesquisa básica sem aplicação regulatória específica; quando não determinável |

Regra de fallback: se não for possível determinar com segurança → `general`.

### 3.4 `species` (display-only)

Normalizar para identificação no S2. Não usado em filtros.

| Valor | Sinônimos |
|---|---|
| `rat` | rato, Rattus norvegicus, Wistar, Sprague-Dawley, Fischer |
| `mouse` | camundongo, Mus musculus, BALB/c, C57BL/6 |
| `rabbit` | coelho, Oryctolagus cuniculus |
| `guinea_pig` | cobaia, Cavia porcellus |
| `chicken` | galinha, frango, Gallus gallus |
| `zebrafish` | peixe-zebra, Danio rerio |
| `in_vitro` | células, cultura celular, linhagem celular |
| `other` | qualquer espécie não listada acima |

---

## 4. Schema do objeto de extração (`ExtractionResult`)

```python
# app/domain/extraction.py

from dataclasses import dataclass
from typing import Optional

@dataclass
class ExtractionResult:
    # Matching fields — normalized vocabulary
    endpoint_category: Optional[str]   # §3.1 or None
    route: Optional[list[str]]         # §3.2 or None
    application_area: str              # §3.3 — defaults to 'general'
    procedure_text: Optional[str]      # free text for embedding concatenation

    # Display-only fields — natural language
    species: Optional[str]             # §3.4 or None
    n_animals: Optional[int]           # integer or None
    regulatory: Optional[bool]         # True/False/None

    # Extraction metadata
    confidence: str                    # 'high' | 'medium' | 'low'
    raw_text_excerpt: Optional[str]    # trecho do protocolo que originou os parâmetros
```

O campo `confidence` já está no contrato do `POST /analyze` (ADR-010).
O campo `raw_text_excerpt` alimenta o display no S2 (tooltip "por que extraí isso").

---

## 5. Texto para embedding do protocolo

O embedding do protocolo (usado no cosine similarity) é gerado sobre:

```
{endpoint_category} {procedure_text} {application_area}
```

Exemplo (protocolo do protótipo):
```
acute_toxicity Single-dose acute toxicity LD50 Litchfield-Wilcoxon oral intraperitoneal general
```

Regras:
- Campos `null` são omitidos
- `route` é adicionado ao texto se não `null` (melhora similaridade com métodos de mesma via)
- `species` NÃO é incluído no embedding (não deve influenciar o ranking)
- Sempre em inglês (todos os embeddings do banco são em inglês)

---

## 6. Regras de matching no RetrievalService

```
1. HARD FILTER: endpoint_category
   → Se protocol.endpoint_category is not None:
       incluir apenas methods WHERE endpoint_category = protocol.endpoint_category
   → Se None: sem filtro de endpoint (retorna todos; usuário corrigiu ou não corrigiu)

2. SOFT FILTER: route
   → Se protocol.route is not None:
       incluir methods WHERE (routes_applicable IS NULL
                              OR routes_applicable contém qualquer rota de protocol.route)
   → Se None: sem filtro de via

3. RANKING: cosine_similarity(protocol_embedding, method.embedding_json)
   → Calcular sobre os métodos que passaram nos filtros 1 e 2
   → Retornar todos, ordenados por score DESC
   → Frontend aplica opacidade para scores ≤ 65% (ADR-011)

4. MINIMUM RESULTS RULE:
   → Se resultado dos filtros < 3 métodos: relaxar filtro de route (manter só endpoint)
   → Se ainda < 3: retornar os 3 de maior score sem nenhum filtro
   → Registrar o relaxamento nos logs (para análise H3 no piloto)
```

A "Minimum Results Rule" garante o critério de sucesso do projeto:
"recebe ao menos 3 recomendações relevantes em menos de 60 segundos."

---

## 7. Exemplo completo — protocolo do protótipo

**Input:**
> "Bulgarian Plant Extract Toxicology (Wistar Rat) — Acute Toxicity (LD50) — Single-dose; Litchfield–Wilcoxon LD50; 60 male Wistar rats; p.o. / i.p.; up to 24h observation; LD50, mortality, clinical signs; Regulatory: Yes"

**ExtractionResult esperado:**
```python
ExtractionResult(
    endpoint_category = "acute_toxicity",
    route             = ["oral", "intraperitoneal"],
    application_area  = "general",
    procedure_text    = "Single-dose acute toxicity LD50 Litchfield-Wilcoxon",
    species           = "rat",
    n_animals         = 60,
    regulatory        = True,
    confidence        = "high",
    raw_text_excerpt  = "Single-dose acute toxicity; Litchfield–Wilcoxon LD50"
)
```

**Texto para embedding:**
```
acute_toxicity Single-dose acute toxicity LD50 Litchfield-Wilcoxon oral intraperitoneal general
```

**Filtros aplicados:**
1. endpoint_category = 'acute_toxicity' → retém: TG 420, 423, 425, GD 129
2. route contém 'oral' ou 'intraperitoneal' → todos os 4 passam (routes_applicable = ["oral"])

**Resultado esperado no S3:** TG 420, 423, 425, GD 129 — ordenados por cosine similarity.

---

## 8. Campos `routes_applicable` na tabela `methods` — valores por método

Para popular via UPDATE (ver `patch_routes.sql`):

| slug | routes_applicable |
|---|---|
| oecd-tg439-epiderm | `["dermal"]` |
| oecd-tg439-episkin | `["dermal"]` |
| oecd-tg431-rhe-corrosion | `["dermal"]` |
| oecd-tg430-ter-corrosion | `["dermal"]` |
| oecd-tg435-membrane-barrier | `["dermal"]` |
| oecd-tg437-bcop | `["ocular"]` |
| oecd-tg438-ice | `["ocular"]` |
| oecd-tg492-rce | `["ocular"]` |
| oecd-tg460-fluorescein-leakage | `["ocular"]` |
| oecd-tg442c-dpra | `["dermal"]` |
| oecd-tg442d-keratinosens | `["dermal"]` |
| oecd-tg442e-hclat | `["dermal"]` |
| oecd-tg429-llna | `["dermal"]` |
| oecd-tg442a-llna-da | `["dermal"]` |
| oecd-tg442b-llna-brdu | `["dermal"]` |
| oecd-tg432-3t3nru | `["dermal"]` |
| oecd-tg428-skin-absorption-vitro | `["dermal"]` |
| oecd-tg471-ames | `null` (in vitro, route-agnostic) |
| oecd-tg476-hprt | `null` |
| oecd-tg487-micronucleus | `null` |
| mat-monocyte-activation | `null` (detects contamination, route-agnostic) |
| niceatm-cytotox-basal-barranco | `["oral"]` |
| oecd-tg420-fixed-dose | `["oral"]` |
| oecd-tg423-atc | `["oral"]` |
| oecd-tg425-udp | `["oral"]` |

---

## 9. Prompt template para ExtractionService

> Manter neste documento; versionar com o código.

```
You are a scientific assistant specializing in animal research ethics.
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

Protocol description:
{{protocol_text}}
```

---

## 10. Questão aberta para o piloto (H1 + H3)

O protótipo usou um input estruturado (tabela com campos explícitos).
O MVP usa free text.

**Teste mínimo antes de Phase 2:** Pedir a 3 pesquisadores que descrevam o protocolo
do exemplo acima em texto livre, sem ver a tabela. Verificar se `endpoint_category`,
`route` e `species` emergem naturalmente. Se não emergirem em ≥2/3 → ativar o
fallback de formulário estruturado (ver ADR-001 §13.6).
