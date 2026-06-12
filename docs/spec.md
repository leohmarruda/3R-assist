# spec.md — 3R Assist

> Status: 🟢 Phases A–D complete. M2.5 Spec Sync applied. M3 Database sync applied.
> Input: `project-proposal.md` + `assumption-log.md`

---

## Phase A — What Are We Building?

### 2.1 Project Definition

3R Assist is an AI-powered decision-support web application for scientific researchers and ethics committee members who need to identify validated alternatives to animal use. A user submits a free-text description of an experimental protocol in Portuguese or English; the system extracts the core parameters (biological model, objective, procedure, endpoint, application area), matches them against a curated database of alternative methods using semantic similarity and structured filters, and returns ranked recommendations classified under the 3Rs framework (Replacement / Reduction / Refinement) with jurisdictional validity indicators and links to primary sources. The core differentiator is that the tool analyzes the protocol before searching — existing resources require the researcher to already know the relevant vocabulary.

---

### 2.2 Features

#### Minimal — MVP (Phases 1–2, months 0–6)

| # | Feature | Notes |
|---|---|---|
| F01 | Free-text protocol input (PT/EN) | Single textarea; no required fields |
| F02 | LLM-based parameter extraction | Extracts 7 fields per `docs/parameter_model.md`: **matching** — `endpoint_category`, `route`, `application_area`, `procedure_text`; **display-only** — `species`, `n_animals`, `regulatory`. Returns `confidence` (high/medium/low) |
| F03 | Parameter display and inline correction | User sees and can edit extracted parameters before the search runs |
| F04 | Ranked recommendations | Sorted by relevance score; each shows 3Rs class, jurisdictional indicator, confidence, matched parameters, source links; cards with score ≤ 65% rendered at reduced opacity to signal lower confidence — see ADR-011 |
| F05 | 3Rs classification per result | Replacement / Reduction / Refinement label on each recommendation |
| F06 | Jurisdictional validity indicator | Brazil / International / Both per result |
| F07 | Direct database search | Structured filters: 3Rs class, endpoint, application area, jurisdiction; for users who already know what to look for |
| F08 | User accounts — email magic link | Simple auth; visible anonymous bypass |
| F09 | Query history | Registered users only; list of past queries with results |
| F10 | PDF/CSV export | Registered users only; export button visible to anonymous users but locked on click — prompts registration. Prevents hiding the feature while maintaining the auth incentive. See ADR-009 |
| F11 | Structured feedback questionnaire | Shown after each query; captures relevance ratings and comments |
| F12 | Method suggestion form | Submissions queued for manual review by Karynn |
| F13 | Bilingual interface | All UI copy in Portuguese and English |
| F14 | Initial curated database | 25 methods across 9 endpoint categories, sourced from CONCEA RN 18/2014 and corresponding OECD guidelines. All entries `active = FALSE` pending Karynn review (`docs/karynn_review_checklist.md`) |

#### Full — Phase 3 (months 6–9)

| # | Feature |
|---|---|
| F15 | Expanded database (hundreds of methods) |
| F16 | Endpoint-and-application-area method requirements checklist |
| F17 | Side-by-side method comparison |
| F18 | User profiles with research area and preferences |

#### Extended — Phase 4+ (months 9–12)

| # | Feature |
|---|---|
| F19 | Real-time PubMed literature ingestion |
| F20 | Collaborative curation platform |
| F21 | Integration with funding databases and regulatory reporting |
| F22 | Public API for protocol management systems |

---

### 2.3 UI Overview

Six primary screens. Detailed mockups in `/design/`. Nav has two primary items only: **Analisar** (S1) and **Buscar** (S4). S5 accessed via auth state in nav. S6 not in nav — accessed via link at bottom of S3 and app footer (see ADR-008).

| Screen | Purpose | Key interactions |
|---|---|---|
| **S1 — Input** | Protocol submission | Free-text area; PT/EN language toggle inside the input shell (pills in top bar of textarea — not a global page toggle); submit CTA; link to S4 below CTA; anonymous bypass as low-prominence text below a divider |
| **S2 — Parameters** | Extracted parameter review | Confidence indicator (high/medium/low) in screen header — see ADR-010; editable field per parameter; incomplete fields highlighted (non-blocking); "run search" CTA; back link to S1 |
| **S3 — Results** | Ranked recommendations | Protocol parameter summary below header; horizontal filter bar (3Rs class, jurisdiction) above card list — not a sidebar; card list ordered by relevance; cards with score ≤ 65% at reduced opacity (see ADR-011); each card: method name, 3Rs class badge, jurisdiction badge, confidence score, matched parameters, source links; export button visible-but-locked for anonymous (see ADR-009); feedback questionnaire (F11) below card list; "Suggest method not listed" link at bottom (see ADR-012) |
| **S4 — Direct Search** | Filter-based discovery | Persistent sidebar filter panel (3Rs class, endpoint, application area, jurisdiction) — sidebar justified by iterative filter comparison workflow; unranked result list (no embedding step) with count of total methods |
| **S5 — Account / History** | Query log and exports | Registered users only — anonymous users redirected to S1 with registration invite; query list with date, protocol snippet, result count; inline accordion expansion; PDF/CSV export per query |
| **S6 — Method Suggestion** | Crowdsourced additions | Not in primary nav — accessed from S3 "Suggest method" link and footer; form: method name (required), source URL, 3Rs class, notes; auth optional (email pre-filled if logged in); expectation notice: manual review queue, no publication timeline |

> Parameters screen (S2) is a gate — the search does not run until the user confirms or edits the extracted parameters. This is the key UX insurance for assumption H3.

---

**Assumption-log checkpoint** *(Phase A → Phase B gate):*

| # | Status after Phase A spec work |
|---|---|
| H1 | Still-Untested — spec work does not validate free-text quality; test with 5 researchers before Phase B lock |
| H2 | Still-Untested — data source coverage must be verified manually before committing to the methods database design in 2.6 |
| H3 | Still-Untested — extraction precision is the core risk; the S2 parameter correction screen is the mitigation, not the validation |
| H4 | Still-Untested — source traceability is designed in (F04 source links), but trust has not been tested |
| H5 | Still-Untested — curation tractability must be estimated before committing to database design in 2.6 |

> **Decision:** H2 and H5 are Phase B blockers. Before finalizing the data architecture (2.6), Karynn must complete the 2-hour curation tractability check (H5) and the 10-protocol coverage check (H2). If either fails, the methods database scope or structure changes.

---

## Phase B — How Is It Structured?

> All decisions in Phase B reference `patterns.md`. Deviations logged as ADRs in `decisions.md`.

### 2.4 Architecture

**Choice:** Layered — Presentation / Service / Repository / Data. Default per `patterns.md`.

The RAG pipeline maps cleanly onto this:

| Layer | Contents |
|---|---|
| **Presentation** | FastAPI route handlers; React frontend |
| **Service** | ExtractionService, RetrievalService, RankingService, ExportService |
| **Repository** | MethodRepository, UserRepository, QueryRepository, FeedbackRepository |
| **Data** | PostgreSQL (Neon/Vercel Postgres); sentence-transformers model (local) |

No escalation to Event-driven or Microservices — neither condition is met at MVP. See ADR-002.

Key bottleneck under load: the Service layer (embedding generation + cosine similarity). At 25 methods this is trivial; at hundreds of methods (Phase 3), embedding index or approximate nearest-neighbor search becomes relevant. Not addressed until measured. See `patterns.md` → Performance Optimization.

---

### 2.5 Stack

| Component | Choice | Rationale |
|---|---|---|
| Backend language | Python 3.11+ | Native ecosystem for ML/embedding libs; team familiarity |
| Backend framework | FastAPI | Async by default; OpenAPI spec auto-generated; minimal boilerplate |
| Frontend | React 18 + Vite | SPA; static deploy on Vercel; team familiarity |
| LLM | Anthropic API (`claude-sonnet-4-20250514`) | Parameter extraction; cost per query is a fraction of a cent |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) | Local; zero API cost; 384-dim vectors; sufficient for small corpus |
| Database | PostgreSQL (Neon/Vercel Postgres) | Zero fixed cost; free tier covers MVP scale; JSONB for embeddings; pgvector path for Phase 3. See ADR-013 |
| DB driver | `asyncpg` | Async PostgreSQL driver; consistent with FastAPI async model |
| Auth | Custom magic link — `itsdangerous` tokens + Resend email | No auth service dependency; Resend free tier: 3,000 emails/month |
| Export | `reportlab` (PDF) + Python `csv` stdlib | Lightweight; no external service |
| Frontend state | React local state + `fetch` | No global state manager needed at MVP per `patterns.md` |
| Styling | Tailwind CSS | Utility-first; no design system overhead at MVP |
| i18n | `react-i18next` | Bilingual requirement (PT/EN) from day one |

**ADR references:** ADR-002 (Python/FastAPI), ADR-003 (React/Vite), ADR-013 (PostgreSQL — supersedes ADR-004), ADR-005 (sentence-transformers).

> **Database note:** Single `DATABASE_URL` env var (standard `postgresql://` connection string). Both dev and prod use PostgreSQL — dev connects to a Neon branch or local PostgreSQL instance. See ADR-013.

---

### 2.6 Data Architecture

> ⚠️ **H2 and H5 are Partially Addressed.** Karynn's source analysis and curation of 25 methods (RN 18/2014 + OECD) established feasibility. Formal structured checks (ECVAM DB-ALM export count, per-entry curation time) are still required to declare Tested. See `assumption-log.md`.

**Pattern:** Repository for Methods domain. Active Record acceptable for User/Auth CRUD (no domain logic). See ADR-006.

#### Domain entities

**Method** *(the core of the product — source of truth: `db/migrations/001_initial.sql`)*
```
id                  SERIAL PRIMARY KEY
slug                TEXT NOT NULL UNIQUE          -- human-readable curation key
name_en             TEXT NOT NULL
name_pt             TEXT NOT NULL
description_en      TEXT NOT NULL
description_pt      TEXT NOT NULL
text_for_embedding  TEXT NOT NULL                 -- exact string used at embed time
category_3r         TEXT NOT NULL                 -- 'replacement' | 'reduction' | 'refinement'
endpoint_category   TEXT NOT NULL                 -- see parameter_model.md §3.1 vocabulary
application_area    TEXT NOT NULL                 -- 'pharma' | 'cosmetics' | 'chemical_safety' | 'general'
oecd_tg_ref         TEXT                          -- e.g. 'TG 439', 'GD 129'
source_db           TEXT NOT NULL                 -- 'ECVAM_DBALM' | 'NICEATM' | 'FARMACOPEIA_BR' | 'TSAR'
validation_status   TEXT NOT NULL                 -- 'validated' | 'accepted' | 'emerging'
jurisdiction        TEXT NOT NULL                 -- 'brazil' | 'international' | 'both'
jurisdiction_notes  TEXT
primary_lit_url     TEXT
regulatory_url      TEXT
routes_applicable   JSONB                         -- e.g. '["oral"]', '["dermal"]'; NULL = route-agnostic
embedding_json      JSONB                         -- 384-dim float array; NULL until embed_methods.py runs
active              BOOLEAN NOT NULL DEFAULT FALSE
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**MethodKeyword** *(synonym dictionary for vocabulary bridging)*
```
id          SERIAL PRIMARY KEY
method_id   INTEGER NOT NULL REFERENCES methods(id) ON DELETE CASCADE
keyword     TEXT NOT NULL
language    TEXT NOT NULL    -- 'en' | 'pt'
```

**User** *(source of truth: `db/migrations/002_app_tables.sql`)*
```
id           SERIAL PRIMARY KEY
email        TEXT NOT NULL UNIQUE
created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**MagicLinkToken**
```
id          SERIAL PRIMARY KEY
user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
token_hash  TEXT NOT NULL UNIQUE    -- SHA-256 of raw token; never store the token itself
expires_at  TIMESTAMPTZ NOT NULL
used_at     TIMESTAMPTZ             -- NULL = unused; set on first verify to prevent replay
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**Query** *(each analysis or search session)*
```
id                SERIAL PRIMARY KEY
user_id           INTEGER REFERENCES users(id) ON DELETE SET NULL    -- NULL = anonymous
protocol_text     TEXT NOT NULL                -- raw input; stored with user consent
extracted_params  JSONB                        -- ExtractionResult per parameter_model.md
confidence        TEXT                         -- 'high' | 'medium' | 'low'
results_snapshot  JSONB                        -- [{method_id, slug, score}] at query time
created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**Feedback** *(one row per method per query)*
```
id          SERIAL PRIMARY KEY
query_id    INTEGER NOT NULL REFERENCES queries(id) ON DELETE CASCADE
method_id   INTEGER NOT NULL REFERENCES methods(id) ON DELETE CASCADE
rating      TEXT NOT NULL    -- 'relevant' | 'partial' | 'not_relevant'
comment     TEXT
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
UNIQUE (query_id, method_id)
```

**Suggestion** *(F12 — user-submitted methods, queued for Karynn)*
```
id              SERIAL PRIMARY KEY
user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL
name_en         TEXT NOT NULL
name_pt         TEXT
description     TEXT
source_url      TEXT
endpoint_hint   TEXT          -- user's best guess; not validated
status          TEXT NOT NULL DEFAULT 'pending'    -- 'pending' | 'reviewed' | 'accepted' | 'rejected'
reviewer_notes  TEXT
submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
reviewed_at     TIMESTAMPTZ
```

> **Recommendation entity removed:** the original spec had a separate Recommendation table. This was collapsed into `queries.results_snapshot JSONB` to simplify the schema and avoid a large join table at MVP scale. Feedback now references `(query_id, method_id)` directly instead of `recommendation_id`.

#### Retrieval approach (MVP)

At 25 methods, full corpus embedding comparison is trivially fast. No vector index or approximate nearest-neighbor library needed. Algorithm (see `docs/parameter_model.md` §6 for full specification):

1. Embed the confirmed protocol parameters (`endpoint_category` + `procedure_text` + `application_area` + routes) using `sentence-transformers`.
2. **Hard filter:** retain only methods where `endpoint_category` matches the protocol (if not null).
3. **Soft filter:** retain methods where `routes_applicable IS NULL` OR `routes_applicable` contains any protocol route (if route not null).
4. Load filtered method embeddings from the database (in-memory, negligible at this scale).
5. Compute cosine similarity between the query vector and each method embedding.
6. Return all results sorted by score descending.
7. **Minimum results rule:** if fewer than 3 methods pass filters, relax route filter then endpoint filter until ≥ 3 results or all methods are returned. Log each relaxation for H3 analysis.

Revisit at Phase 3 when the corpus exceeds ~200 methods (pgvector extension available on Neon).

---

### 2.7 Infrastructure

| Component | Dev | Prod |
|---|---|---|
| Frontend | `localhost:5173` (Vite) | Vercel (free tier, static SPA) |
| Backend | `localhost:8000` (uvicorn) | Render (free tier, Python web service) |
| Database | Neon branch or local PostgreSQL | Neon (Vercel Postgres, free tier) |
| Embeddings model | Local download on first run | Bundled with Render service (downloaded at build time) |
| Email | Console log (dev) | Resend (free tier, 3,000 emails/month) |
| Secrets | `.env` file | Render environment variables + Vercel environment variables |

**Environments to confirm operational before M3.0 begins:**
- [ ] Vercel project linked to repo, auto-deploy from `main`
- [ ] Render service created, environment variables set
- [x] ~~Turso database created~~ → Neon project created, `DATABASE_URL` set in Render env vars
- [ ] Resend domain verified, API key set

*Checkpoint: No Phase B contradictions identified. Architecture (Layered), stack (Python/FastAPI + React/Vite), data access (Repository + in-memory cosine similarity), and infrastructure (Vercel + Render + Neon) are mutually consistent. All Phase B decisions reference `patterns.md` defaults or are logged as ADRs. Database updated to PostgreSQL per ADR-013.*

---

## Phase C — How Is It Organized?

### 2.8 Project Structure

```
3r-assist/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, router registration
│   │   ├── config.py                # Settings loaded from env vars (12-Factor)
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── analysis.py      # POST /analyze
│   │   │       ├── search.py        # GET  /search
│   │   │       ├── methods.py       # GET  /methods
│   │   │       ├── auth.py          # POST /auth/magic-link, GET /auth/verify
│   │   │       ├── queries.py       # GET  /queries  (auth required)
│   │   │       ├── feedback.py      # POST /feedback
│   │   │       └── suggestions.py   # POST /suggestions
│   │   ├── services/
│   │   │   ├── extraction.py        # Protocol text → ExtractionResult
│   │   │   ├── retrieval.py         # ExtractionResult + filters → ranked Methods
│   │   │   └── export.py            # Query results → PDF / CSV
│   │   ├── repositories/
│   │   │   ├── methods.py           # MethodRepository
│   │   │   ├── users.py             # UserRepository
│   │   │   ├── queries.py           # QueryRepository
│   │   │   └── feedback.py          # FeedbackRepository + SuggestionRepository
│   │   ├── adapters/
│   │   │   ├── llm.py               # Anthropic API → ExtractionResult (ACL)
│   │   │   └── embedder.py          # sentence-transformers → float[] (ACL)
│   │   ├── models/                  # Pydantic domain models
│   │   │   ├── method.py
│   │   │   ├── protocol.py          # ExtractionResult (see docs/parameter_model.md)
│   │   │   ├── recommendation.py
│   │   │   └── user.py
│   │   └── db/
│   │       ├── connection.py        # asyncpg connection pool (DATABASE_URL)
│   │       └── migrations/
│   │           ├── 001_initial.sql  # methods + method_keywords
│   │           └── 002_app_tables.sql  # users, magic_link_tokens, queries, feedback, suggestions
│   ├── scripts/
│   │   ├── embed_methods.py         # generate embeddings for active methods (asyncpg)
│   │   └── smoke_test.py            # manual smoke test (CI optional per ADR-001)
│   ├── tests/
│   ├── docs/
│   │   ├── parameter_model.md       # extraction schema, vocabularies, matching rules
│   │   └── karynn_review_checklist.md  # per-method review before active = TRUE
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/                   # S1–S6 page components
│   │   ├── components/              # Shared UI components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/
│   │   │   ├── api.js               # All fetch calls; typed request/response
│   │   │   └── i18n.js              # react-i18next setup
│   │   └── locales/
│   │       ├── pt.json
│   │       └── en.json
│   ├── package.json
│   └── vite.config.js
├── spec.md
├── decisions.md
├── patterns.md
├── assumption-log.md
├── dev-plan.md
├── execution-log.md
├── README.md
├── .env.example
├── design/
├── prompts/
└── validation/
```

---

### 2.9 Modules & Responsibilities

| Module | Single responsibility | Dependencies (injected) |
|---|---|---|
| `extraction.py` | Accept raw protocol text, return `ExtractionResult` | `LLMAdapter` |
| `retrieval.py` | Accept `ExtractionResult` + filters, return ranked `Recommendation[]` | `EmbedderAdapter`, `MethodRepository` |
| `export.py` | Accept a query result set, return PDF bytes or CSV string | — |
| `llm.py` (adapter) | Translate Anthropic API response → `ExtractionResult`; own all retry logic | Anthropic API key (from config) |
| `embedder.py` (adapter) | Translate text → `float[]`; own model loading | Model path (from config) |
| `MethodRepository` | All query logic for the methods table; own embedding storage/retrieval | DB connection |
| Route handlers | Validate HTTP request, call one service, return HTTP response | Service instances |

**DIP enforcement:** Route handlers import services; services import repositories and adapters; repositories import `db/connection`; adapters import external clients. No layer imports a layer above it. Domain models (`models/`) are imported by all layers but import nothing.

**Heuristic check:** `extraction.py` must be unit-testable by injecting a mock `LLMAdapter` that returns a fixed `ExtractionResult` object — no real API call in tests.

---

### 2.10 Workflows

**W1 — Free-text analysis (primary path)**
```
User (S1) → POST /analyze {protocol_text}
  → ExtractionService.extract(text)
    → LLMAdapter.extract_parameters(text) → ExtractionResult
  → return ExtractionResult to frontend (S2)
User edits/confirms parameters (S2)
  → POST /search {params, filters}
    → RetrievalService.search(params, filters)
      → EmbedderAdapter.embed(params_text) → query_vector
      → MethodRepository.get_filtered(endpoint, routes) → [(Method, embedding)]
      → cosine_similarity(query_vector, embeddings) → scored_methods
      → apply_minimum_results_rule(scored_methods) → final_results
    → QueryRepository.save(query, results_snapshot)
  → return Recommendation[] to frontend (S3)
```

**W2 — Direct search (F07)**
```
User (S4) → POST /search {filters only, no protocol_text}
  → RetrievalService.search(params=None, filters)
    → MethodRepository.filter(filters) → Method[]
    → return unranked Method[] (no embedding step)
  → return to frontend (S4)
```

**W3 — Magic link auth**
```
User enters email (S1 or S5) → POST /auth/magic-link {email}
  → UserRepository.get_or_create(email)
  → generate signed token (itsdangerous, 30-min expiry)
  → store SHA-256(token) in magic_link_tokens (expires_at, used_at=NULL)
  → EmailService.send_magic_link(email, token)
  → 202 Accepted (no content)
User clicks link in email → GET /auth/verify?token=...
  → validate token signature + expiry (itsdangerous)
  → lookup SHA-256(token) in magic_link_tokens; reject if used_at IS NOT NULL
  → set used_at = NOW() (single-use enforcement)
  → set session cookie (httponly, secure)
  → redirect to S1
```

**W4 — Feedback (F11)**
```
User rates recommendation (S3) → POST /feedback {query_id, method_id, rating, comment}
  → FeedbackRepository.save(feedback)   -- UNIQUE (query_id, method_id)
  → 201 Created
```

**W5 — Method suggestion (F12)**
```
User submits suggestion (S6) → POST /suggestions {name, source_url, class, notes}
  → SuggestionRepository.save(suggestion, status='pending')
  → 201 Created (no email notification at MVP)
```

---

### 2.11 Interfaces

All interfaces defined here before any handler is written. OpenAPI spec generated from FastAPI route definitions — treat FastAPI type annotations as the contract.

**Error envelope (consistent across all endpoints):**
```json
{
  "error": {
    "code": "EXTRACTION_FAILED",
    "message": "Could not extract parameters from the provided text.",
    "detail": {}
  }
}
```

**Key endpoint contracts:**

`POST /analyze`
- Request: `{ "protocol_text": string }` (min 20 chars, max 5000 chars)
- Response 200:
```json
{
  "params": {
    "endpoint_category": "acute_toxicity"|"skin_irritation"|...|null,
    "route": ["oral","intraperitoneal"]|null,
    "application_area": "pharma"|"cosmetics"|"chemical_safety"|"general",
    "procedure_text": string|null,
    "species": "rat"|"mouse"|...|null,
    "n_animals": integer|null,
    "regulatory": boolean|null,
    "raw_text_excerpt": string|null
  },
  "confidence": "high"|"medium"|"low"
}
```
- Response 422: error envelope with `EXTRACTION_FAILED`
- LLM failures → typed error return from `ExtractionService`, never a raw exception
- Full vocabulary for `endpoint_category`, `route`, `species`: see `docs/parameter_model.md` §3

`POST /search`
- Request: `{ "params": ExtractionResult|null, "filters": { "three_r_class": string|null, "jurisdiction": string|null, "endpoint": string|null } }`
- Response 200: `{ "query_id": integer, "results": Recommendation[] }`

`POST /auth/magic-link`
- Request: `{ "email": string }`
- Response 202: `{}` (always 202 regardless of whether email exists — prevents enumeration)

`POST /feedback`
- Request: `{ "query_id": integer, "method_id": integer, "rating": "relevant"|"partial"|"not_relevant", "comment": string|null }`
- Response 201: `{}`
- Response 409: if (query_id, method_id) already has a rating — use PUT to update
- Auth: optional (anonymous feedback accepted)

**ACL contracts:**

`LLMAdapter` interface (domain-facing):
```python
def extract_parameters(self, text: str) -> Result[ExtractionResult, ExtractionError]
```
The adapter owns all Anthropic API shapes, retry logic, and response parsing. The `ExtractionService` never sees `anthropic.types.*`. The prompt template lives in `docs/parameter_model.md` §9 and is versioned with the code.

`EmbedderAdapter` interface:
```python
def embed(self, text: str) -> list[float]
def embed_batch(self, texts: list[str]) -> list[list[float]]
```

*"For each interface: which layer owns it and which implements it?"* — Both ACL interfaces are owned by the Service layer (defines the signature it needs) and implemented by the Adapters layer. Dependency arrow points inward. ✓

---

## Phase D — How Does It Ship?

### 2.12 Development Dependencies

Before writing any code, the following must be in place (M3.0 checklist):

| Dependency | Notes |
|---|---|
| Python 3.11+ | Runtime |
| Node 18+ | Frontend toolchain |
| `sentence-transformers` | Downloads `all-MiniLM-L6-v2` on first run (~90MB) |
| `asyncpg` | PostgreSQL async driver |
| `python-dotenv` | Load `.env` in dev |
| Anthropic API key | `ANTHROPIC_API_KEY` in `.env` |
| Resend account | Free tier; `RESEND_API_KEY` in `.env` |
| Neon account | Free tier; `DATABASE_URL` in `.env` (dev branch) and Render env vars (prod) |
| Vercel account | Linked to repo; auto-deploy configured |
| Render account | Python service created; env vars set |

---

### 2.13 MVP Definition

The minimum subset required to run the pilot (W1 + feedback + bilingual UI):

**In scope for pilot gate:**
F01, F02, F03, F04, F05, F06, F11, F13, F14

**In MVP but not required for pilot gate:**
F07 (direct search), F08 (accounts), F09 (query history), F10 (export), F12 (method suggestion)

**Rationale:** The pilot validates whether free-text → relevant recommendations works. Auth and history are necessary for a production-quality MVP but not for the 5-session pilot. Build the full Minimal feature set, but the pilot gate criteria depend only on the core recommendation loop.

---

### 2.14 Security & Privacy Check

> Minimal tier: findings logged here as known risks. Escalate to ADRs + named tasks when graduating to Standard tier (per ADR-001).

**Surface 1 — LLM prompt injection**
- Risk: malicious protocol text manipulates the extraction prompt to return attacker-controlled content or leak system prompt context.
- Impact: medium (no sensitive data in system prompt at MVP; worst case is garbage extraction results).
- Mitigation: system prompt with strict JSON output schema; validate output against `ExtractionResult` Pydantic model; reject responses that don't parse. Never render raw LLM output directly in the frontend.

**Surface 2 — Magic link token security**
- Risk: token interception (email in transit) or token brute-force.
- Impact: account takeover (low severity given no payment or highly sensitive data).
- Mitigation: `itsdangerous` HMAC-signed tokens; 30-minute expiry; single-use (invalidate on first verify); HTTPS only.

**Surface 3 — Protocol text storage and privacy**
- Risk: protocol descriptions may contain unpublished research details. A data breach exposes researcher IP.
- Impact: medium — reputational damage to the project and Fórum Animal.
- Mitigation: display explicit consent notice before storing query history (F09). Anonymous queries: store extracted parameters only, not raw protocol text. Logged as a known risk for the pilot (MVP stores raw text for registered users with consent).

**Surface 4 — Rate limiting**
- Risk: uncapped `/analyze` endpoint allows abuse of the Anthropic API (variable cost).
- Impact: cost overrun.
- Mitigation: rate limit `/analyze` at the Render level (or middleware): max 10 requests/IP/hour. Add before production deploy.

---

### 2.15 Roadmap

| Phase | Goal | Depends on | Entry criteria |
|---|---|---|---|
| **0 — Bootstrap & Spec** | Repository, scaffold, spec.md complete | — | This document finalized; H2 + H5 validated by Karynn |
| **1 — Core pipeline (months 0–3)** | Working extraction → retrieval loop locally; 25 seeded methods activated after Karynn review | Phase 0 complete; H2 + H5 validated | `spec.md` finalized; environments accessible; Karynn review complete |
| **2 — Production web app (months 3–6)** | Full MVP feature set deployed; internal testing complete | Phase 1 pipeline validated locally | Phase 1 DoD met; all environments confirmed operational |
| **3 — Pilot (months 6–9)** | 5–10 users complete pilot protocol; ≥3/5 rate recommendations relevant | Phase 2 deployed and stable | M4 review passed; M5 protocol drafted |
| **4 — Iteration & expansion (months 9–12)** | Expanded database; Full-scope features (F15–F18); publication prep | Pilot findings incorporated | Pilot go/no-go decision logged; blocker findings resolved |

---

> **Status:** 🟢 Phases A–D complete. M2.5 Spec Sync applied. M3 Database sync applied.
> Next: Phase 1 — core pipeline implementation.
> H2 + H5 partially addressed; formal checks required before declaring Tested.
> `db/connection.py` uses asyncpg pool; migrations in `backend/app/db/migrations/`.

---

*Populated at end of Module 2. Updated after Module 2.5 Spec Sync. Updated after M3 Database work.*
