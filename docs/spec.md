# spec.md — 3R Assist

> Status: 🟢 Phases A–D complete. M2.5 Spec Sync applied.
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
| F02 | LLM-based parameter extraction | Extracts: biological model · objective · procedure · endpoint · application area |
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
| F14 | Initial curated database | 10–20 methods covering the most common CEUA use cases in Brazil |

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
| **Data** | SQLite (via Turso in prod); sentence-transformers model (local) |

No escalation to Event-driven or Microservices — neither condition is met at MVP. See ADR-002.

Key bottleneck under load: the Service layer (embedding generation + cosine similarity). At 10–20 methods this is trivial; at hundreds of methods (Phase 3), embedding index or approximate nearest-neighbor search becomes relevant. Not addressed until measured. See `patterns.md` → Performance Optimization.

---

### 2.5 Stack

| Component | Choice | Rationale |
|---|---|---|
| Backend language | Python 3.11+ | Native ecosystem for ML/embedding libs; team familiarity |
| Backend framework | FastAPI | Async by default; OpenAPI spec auto-generated; minimal boilerplate |
| Frontend | React 18 + Vite | SPA; static deploy on Vercel; team familiarity |
| LLM | Anthropic API (`claude-sonnet-4-20250514`) | Parameter extraction; cost per query is a fraction of a cent |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) | Local; zero API cost; 384-dim vectors; sufficient for small corpus |
| Database | SQLite (dev) + Turso (prod) | Zero fixed cost; SQLite-compatible API; persistent storage on free tier |
| ORM | SQLAlchemy (Core, not ORM) | Lightweight; full SQL control; works with Turso's libSQL driver |
| Auth | Custom magic link — `itsdangerous` tokens + Resend email | No auth service dependency; Resend free tier: 3,000 emails/month |
| Export | `reportlab` (PDF) + Python `csv` stdlib | Lightweight; no external service |
| Frontend state | React local state + `fetch` | No global state manager needed at MVP per `patterns.md` |
| Styling | Tailwind CSS | Utility-first; no design system overhead at MVP |
| i18n | `react-i18next` | Bilingual requirement (PT/EN) from day one |

**ADR references:** ADR-002 (Python/FastAPI), ADR-003 (React/Vite), ADR-004 (SQLite/Turso), ADR-005 (sentence-transformers).

> **Render free tier note:** Render's free tier has ephemeral disk storage — SQLite files are lost on restart. Turso (libSQL, SQLite-compatible) provides persistent storage on a free tier and is the prod database choice. Local dev uses a plain SQLite file. See ADR-004.

---

### 2.6 Data Architecture

> ⚠️ **H2 and H5 are still Untested.** This data architecture assumes the curated database is feasible and coverage is adequate. Both assumptions must be validated (Karynn's 2-hour check) before any data ingestion work begins in M3.

**Pattern:** Repository for Methods domain. Active Record acceptable for User/Auth CRUD (no domain logic). See ADR-006.

#### Domain entities

**Method** *(the core of the product)*
```
id              TEXT PRIMARY KEY
name            TEXT NOT NULL
description     TEXT NOT NULL          -- human-readable summary
three_r_class   TEXT NOT NULL          -- 'replacement' | 'reduction' | 'refinement'
endpoint        TEXT                   -- e.g. 'acute toxicity', 'genotoxicity'
application_area TEXT                  -- e.g. 'safety testing', 'basic research'
jurisdiction    TEXT NOT NULL          -- 'brazil' | 'international' | 'both'
source_urls     TEXT NOT NULL          -- JSON array of URLs
validation_status TEXT                 -- 'validated' | 'peer-reviewed' | 'regulatory'
embedding       BLOB                   -- serialized float32 vector (384 dims)
created_at      TEXT
updated_at      TEXT
```

**User**
```
id              TEXT PRIMARY KEY
email           TEXT UNIQUE NOT NULL
created_at      TEXT
last_seen_at    TEXT
```

**Query** *(each analysis or search session)*
```
id              TEXT PRIMARY KEY
user_id         TEXT                   -- nullable (anonymous)
protocol_text   TEXT                   -- raw input; stored with user consent
extracted_params TEXT                  -- JSON: {model, objective, procedure, endpoint, area}
created_at      TEXT
```

**Recommendation** *(results of a query)*
```
id              TEXT PRIMARY KEY
query_id        TEXT NOT NULL
method_id       TEXT NOT NULL
rank            INTEGER
score           REAL
matched_params  TEXT                   -- JSON array of matched parameter keys
```

**Feedback**
```
id              TEXT PRIMARY KEY
recommendation_id TEXT NOT NULL
rating          INTEGER                -- 1–5
comment         TEXT
created_at      TEXT
```

**MethodSuggestion**
```
id              TEXT PRIMARY KEY
submitted_by    TEXT                   -- email or null
name            TEXT NOT NULL
source_url      TEXT
three_r_class   TEXT
notes           TEXT
status          TEXT                   -- 'pending' | 'accepted' | 'rejected'
created_at      TEXT
```

#### Retrieval approach (MVP)

At 10–20 methods, full corpus embedding comparison is trivially fast. No vector index or approximate nearest-neighbor library needed. Algorithm:

1. Embed the confirmed protocol parameters (concatenated as a single text) using `sentence-transformers`.
2. Load all method embeddings from the database (in-memory, negligible at this scale).
3. Compute cosine similarity between the query vector and each method embedding.
4. Apply structured filters (3Rs class, jurisdiction, endpoint) as a post-filter mask.
5. Return top-k by score.

This approach requires zero additional infrastructure and is correct for the MVP corpus size. Revisit at Phase 3 when the corpus exceeds ~500 methods.

---

### 2.7 Infrastructure

| Component | Dev | Prod |
|---|---|---|
| Frontend | `localhost:5173` (Vite) | Vercel (free tier, static SPA) |
| Backend | `localhost:8000` (uvicorn) | Render (free tier, Python web service) |
| Database | SQLite file `./data/dev.db` | Turso (libSQL, free tier) |
| Embeddings model | Local download on first run | Bundled with Render service (downloaded at build time) |
| Email | Console log (dev) | Resend (free tier, 3,000 emails/month) |
| Secrets | `.env` file | Render environment variables + Vercel environment variables |

**Environments to confirm operational before M3.0 begins:**
- [ ] Vercel project linked to repo, auto-deploy from `main`
- [ ] Render service created, environment variables set
- [ ] Turso database created, connection string in Render env vars
- [ ] Resend domain verified, API key set

*Checkpoint: No Phase B contradictions identified. Architecture (Layered), stack (Python/FastAPI + React/Vite), data access (Repository + in-memory cosine similarity), and infrastructure (Vercel + Render + Turso) are mutually consistent. All Phase B decisions reference `patterns.md` defaults or are logged as ADRs.*

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
│   │   │   ├── extraction.py        # Protocol text → ProtocolParameters
│   │   │   ├── retrieval.py         # ProtocolParameters + filters → ranked Methods
│   │   │   └── export.py            # Query results → PDF / CSV
│   │   ├── repositories/
│   │   │   ├── methods.py           # MethodRepository
│   │   │   ├── users.py             # UserRepository
│   │   │   ├── queries.py           # QueryRepository
│   │   │   └── feedback.py          # FeedbackRepository + SuggestionRepository
│   │   ├── adapters/
│   │   │   ├── llm.py               # Anthropic API → ProtocolParameters (ACL)
│   │   │   └── embedder.py          # sentence-transformers → float[] (ACL)
│   │   ├── models/                  # Pydantic domain models
│   │   │   ├── method.py
│   │   │   ├── protocol.py          # ProtocolParameters
│   │   │   ├── recommendation.py
│   │   │   └── user.py
│   │   └── db/
│   │       ├── connection.py        # SQLAlchemy engine + session factory
│   │       └── schema.sql           # Table definitions (source of truth)
│   ├── tests/
│   ├── data/
│   │   └── seed/                    # Curated methods as JSON (ingested at deploy)
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
| `extraction.py` | Accept raw protocol text, return `ProtocolParameters` | `LLMAdapter` |
| `retrieval.py` | Accept `ProtocolParameters` + filters, return ranked `Recommendation[]` | `EmbedderAdapter`, `MethodRepository` |
| `export.py` | Accept a query result set, return PDF bytes or CSV string | — |
| `llm.py` (adapter) | Translate Anthropic API response → `ProtocolParameters`; own all retry logic | Anthropic API key (from config) |
| `embedder.py` (adapter) | Translate text → `float[]`; own model loading | Model path (from config) |
| `MethodRepository` | All query logic for the methods table; own embedding storage/retrieval | DB connection |
| Route handlers | Validate HTTP request, call one service, return HTTP response | Service instances |

**DIP enforcement:** Route handlers import services; services import repositories and adapters; repositories import `db/connection`; adapters import external clients. No layer imports a layer above it. Domain models (`models/`) are imported by all layers but import nothing.

**Heuristic check:** `extraction.py` must be unit-testable by injecting a mock `LLMAdapter` that returns a fixed `ProtocolParameters` object — no real API call in tests.

---

### 2.10 Workflows

**W1 — Free-text analysis (primary path)**
```
User (S1) → POST /analyze {protocol_text}
  → ExtractionService.extract(text)
    → LLMAdapter.extract_parameters(text) → ProtocolParameters
  → return ProtocolParameters to frontend (S2)
User edits/confirms parameters (S2)
  → POST /search {params, filters}
    → RetrievalService.search(params, filters)
      → EmbedderAdapter.embed(params_text) → query_vector
      → MethodRepository.get_all_with_embeddings() → [(Method, embedding)]
      → cosine_similarity(query_vector, embeddings) → scored_methods
      → apply_filters(scored_methods, filters) → filtered
      → return top-k Recommendation[]
    → QueryRepository.save(query, recommendations)
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
  → EmailService.send_magic_link(email, token)
  → 202 Accepted (no content)
User clicks link in email → GET /auth/verify?token=...
  → validate token signature + expiry
  → set session cookie (httponly, secure)
  → redirect to S1
```

**W4 — Feedback (F11)**
```
User rates recommendation (S3) → POST /feedback {recommendation_id, rating, comment}
  → FeedbackRepository.save(feedback)
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
- Response 200: `{ "params": { "biological_model": string|null, "objective": string|null, "procedure": string|null, "endpoint": string|null, "application_area": string|null }, "confidence": "high"|"medium"|"low" }`
- Response 422: error envelope with `EXTRACTION_FAILED`
- LLM failures → typed error return from `ExtractionService`, never a raw exception

`POST /search`
- Request: `{ "params": ProtocolParameters|null, "filters": { "three_r_class": string|null, "jurisdiction": string|null, "endpoint": string|null } }`
- Response 200: `{ "query_id": string, "results": Recommendation[] }`

`POST /auth/magic-link`
- Request: `{ "email": string }`
- Response 202: `{}` (always 202 regardless of whether email exists — prevents enumeration)

`POST /feedback`
- Request: `{ "recommendation_id": string, "rating": 1|2|3|4|5, "comment": string|null }`
- Response 201: `{}`
- Auth: optional (anonymous feedback accepted)

**ACL contracts:**

`LLMAdapter` interface (domain-facing):
```python
def extract_parameters(self, text: str) -> Result[ProtocolParameters, ExtractionError]
```
The adapter owns all Anthropic API shapes, retry logic, and response parsing. The `ExtractionService` never sees `anthropic.types.*`.

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
| Anthropic API key | `ANTHROPIC_API_KEY` in `.env` |
| Resend account | Free tier; `RESEND_API_KEY` in `.env` |
| Turso account | Free tier; `TURSO_URL` + `TURSO_AUTH_TOKEN` in `.env` (prod only) |
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
- Mitigation: system prompt with strict JSON output schema; validate output against `ProtocolParameters` Pydantic model; reject responses that don't parse. Never render raw LLM output directly in the frontend.

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
| **1 — Core pipeline (months 0–3)** | Working extraction → retrieval loop locally; seed database with 10–20 methods | Phase 0 complete; H2 + H5 validated | `spec.md` finalized; environments accessible; seed data ready |
| **2 — Production web app (months 3–6)** | Full MVP feature set deployed; internal testing complete | Phase 1 pipeline validated locally | Phase 1 DoD met; all environments confirmed operational |
| **3 — Pilot (months 6–9)** | 5–10 users complete pilot protocol; ≥3/5 rate recommendations relevant | Phase 2 deployed and stable | M4 review passed; M5 protocol drafted |
| **4 — Iteration & expansion (months 9–12)** | Expanded database; Full-scope features (F15–F18); publication prep | Pilot findings incorporated | Pilot go/no-go decision logged; blocker findings resolved |

---

> **Status:** 🟢 Phases A–D complete.
> Next: Module 2.5 (UI Design, Pass A — wireframes) or proceed directly to M3 if UI design is deferred.
> H2 + H5 must be validated before Phase 1 development begins.

---

*Populated at end of Module 2. Updated after Module 2.5 Spec Sync.*
