# Architecture Decision Records — 3R Assist

> ADR log. Every significant architectural, infrastructure, or pattern choice is recorded here.
> Format: `ADR-[NNN]`. Near-impossible decisions are flagged explicitly.
> Updated throughout M2, M2.5, and M3.

---

## ADR-000 — ADR Tooling Choice

**Decision:** Plain markdown ADRs maintained in this file (`decisions.md`).

**Context:** Needed to establish how architectural decisions are recorded before any project work begins (M0 requirement).

**Alternatives evaluated:**

| Option | Trade-off |
|---|---|
| `adr-tools` (CLI) | Generates one .md file per ADR in `/doc/adr/`; cleaner diffs but adds a CLI dependency |
| `Log4brains` | Browsable web UI; overkill for a 2-person Minimal-tier project |
| Inline in this file | Zero tooling; all ADRs in one place; works for a small decision set |

**Rationale:** Minimal scope tier + 2-person team. A single file is easier to reference in prompts and in conversation. If the decision count exceeds ~15, revisit and migrate to `adr-tools`.

**Reversibility:** Easy.

**Consequences:** All ADR entries live here. Each has a unique numeric ID. Search within this file to find decisions.

---

## ADR-001 — Scope Tier Declaration

**Decision:** **Minimal** tier.

**Context:** M0.3 Scope Gate — must be declared before any subsequent module work begins.

**Pattern baseline:** N/A (governance decision, not a software pattern).

**Rationale:** Combined 8h/week hard constraint makes architectural simplicity non-negotiable. The MVP must be complete enough to test the core hypothesis (free-text → relevant recommendations) but no larger. Permitted compressions per the framework:
- Skip M2.5 passes B and C (optional)
- Use a one-page spec *(not applied — detail is needed for the RAG pipeline)*
- Replace formal M5 with 3 informal tests *(deferred — aim for 5+ users given Fórum Animal network access)*
- M3.0 CI is optional — replace with a manual smoke-test script

All compressions applied must be documented in `execution-log.md`.

**Reversibility:** Costly (graduating to Standard tier requires adding skipped artifacts and CI).

**Consequences:** Security findings logged in `assumption-log.md` as known risks, not as ADRs, until the project graduates to Standard tier.

---

---

## ADR-008 — S6 (Method Suggestion) not in primary navigation

**Decision:** S6 is not accessible from the primary navigation bar. It is reached via a "Suggest method not listed" link at the bottom of S3 and a footer link.

**Context:** M2.5 Spec Sync — design diverged from spec, which was silent on nav placement.

**Pattern baseline:** N/A (navigation architecture decision).

**Rationale:** The primary nav has exactly two items: Analisar and Buscar. These represent the two use cases that need zero friction — a researcher who arrives with a protocol, and one who already knows what to look for. S6 is a contribution flow, not a discovery flow — placing it in the primary nav would give it prominence it doesn't merit and add visual complexity to the nav without commensurate value. The S3 placement is contextually correct: a researcher who just received results and finds a gap is the ideal person to suggest a method.

**Reversibility:** Easy.

**Consequences:** S6 is harder to find on first use. Acceptable — method suggestion is a power-user action, not a primary job-to-be-done.

---

## ADR-009 — Export visible-but-locked for anonymous users

**Decision:** The PDF/CSV export button (F10) is rendered and visible on S3 for anonymous users, but clicking it triggers a registration prompt rather than downloading the file.

**Context:** M2.5 Spec Sync — spec said "registered users only" without specifying the anonymous UX.

**Pattern baseline:** N/A (UX interaction pattern).

**Rationale:** Two alternatives were considered: (a) hide the button entirely for anonymous users; (b) show but lock. Option (a) removes a registration incentive and leaves anonymous users unaware that export exists. Option (b) surfaces the feature's value at the moment a user would want it, then converts the friction into a registration motivation. The risk is frustration if the prompt feels like a bait-and-switch — mitigated by the anonymous bypass being clearly visible on S1 (users who choose anonymous know the trade-off upfront).

**Reversibility:** Easy.

**Consequences:** Frontend must check auth state before triggering download. Backend export endpoints remain auth-required — no change to API contracts.

---

## ADR-010 — Confidence indicator on S2 (parameter review screen)

**Decision:** S2 displays a confidence indicator (High / Medium / Low) in the screen header, derived from the LLM extraction response.

**Context:** M2.5 Spec Sync — design added this element; spec 2.3 S2 did not include it.

**Pattern baseline:** N/A (UI element).

**Rationale:** The `POST /analyze` endpoint already returns `"confidence": "high"|"medium"|"low"` (see 2.11 interface contract). Surfacing this on S2 costs nothing technically and gives the user a signal about whether to trust the extraction or scrutinize the fields more carefully. A "Low confidence" indicator makes it immediately obvious why a field is blank or strange — reducing the cognitive load of deciding whether to correct.

**Reversibility:** Easy (remove the indicator element).

**Consequences:** Frontend must render the confidence value from the `/analyze` response. No backend changes.

---

## ADR-011 — Low-score result cards at reduced opacity

**Decision:** Result cards with a relevance score ≤ 65% are rendered at `opacity: 0.65` on S3.

**Context:** M2.5 Spec Sync — design decision not present in spec.

**Pattern baseline:** N/A (visual treatment).

**Rationale:** At MVP, the database has 10–20 methods. Even a query with strong parameters may return low-score matches simply because the corpus is small, not because the method is irrelevant. Hiding low-score results would reduce result counts to near zero in some queries. Rendering them at reduced opacity communicates "present but less confident" without removing information. The threshold of 65% is a first estimate — the pilot feedback (F11 ratings) will reveal whether this calibration is correct.

**Reversibility:** Easy — change or remove the opacity rule.

**Consequences:** The 65% threshold is a frontend-only rule. The backend returns all results sorted by score; the frontend applies the visual treatment. The threshold should be revisited after the pilot based on observed score distributions.

---

## ADR-012 — "Suggest method" link on S3 results screen

**Decision:** S3 includes a contextual link "Método não listado? Sugerir →" at the bottom of the results list, linking to S6.

**Context:** M2.5 Spec Sync — design added this element; spec 2.3 S3 did not include it.

**Pattern baseline:** N/A (navigation/UX element).

**Rationale:** The user who has just received results and found none of them relevant is the highest-value contributor for the method suggestion queue. Placing the link at the moment of disappointment captures the motivation. A generic nav link to S6 would reach users at the wrong moment. This is also consistent with ADR-008 (S6 not in primary nav) — the contextual placement replaces the nav prominence.

**Reversibility:** Easy.

**Consequences:** S3 page component must include the link. No backend changes.

**Decision:** Python 3.11 + FastAPI.

**Context:** Backend language and framework selection (M2.5 Stack).

**Pattern baseline:** `patterns.md` → Application Architecture (Layered).

**Alternatives:** Node.js + Hono (single JS runtime); Django (more batteries, higher overhead).

**Rationale:** `sentence-transformers`, `anthropic`, and the broader ML ecosystem are Python-native. FastAPI is async by default, generates OpenAPI specs automatically, and has minimal boilerplate. Django adds unnecessary overhead for an API-only backend. Node.js would require a separate ML inference service, adding complexity.

**Reversibility:** Costly (full backend rewrite).

**Consequences:** Frontend and backend are different languages — no code sharing. Acceptable given the clear boundary between API and SPA.

---

## ADR-003 — Frontend: React 18 + Vite

**Decision:** React 18 + Vite, deployed as a static SPA on Vercel.

**Context:** Frontend framework selection (M2.5 Stack).

**Pattern baseline:** `patterns.md` → Frontend State Management.

**Alternatives:** Next.js (SSR/full-stack on Vercel); SvelteKit (lighter bundle, smaller ecosystem).

**Rationale:** Static SPA on Vercel requires no server; reduces infrastructure surface. React ecosystem covers all MVP requirements. Next.js SSR adds deployment complexity with no meaningful benefit given the backend is a separate FastAPI service. Vite is fast and well-supported.

**Reversibility:** Costly.

**Consequences:** CORS configuration required between Vite SPA and FastAPI backend. i18n handled client-side via `react-i18next`.

---

## ADR-004 — Database: SQLite (dev) + Turso (prod)

**Decision:** SQLite file for local development; Turso (libSQL) for production.

**Context:** Render free tier has ephemeral disk — SQLite files are destroyed on service restart. A persistent storage solution is required.

**Pattern baseline:** `patterns.md` → Data Access (Repository pattern).

**Alternatives:** Render paid plan ($7/mo persistent disk) — breaks zero fixed cost constraint. Supabase free tier (PostgreSQL) — persistent, generous free tier, but deviates from SQLite and adds a managed service dependency. PlanetScale — MySQL, not SQLite-compatible.

**Rationale:** Turso is SQLite-compatible (libSQL fork), free tier supports the MVP scale, and preserves local SQLite semantics for development.

**Reversibility:** Moderate (migration to PostgreSQL is a data-model refactor, not a full rewrite).

**Consequences:** Two different drivers (sqlite3 stdlib locally, libsql-client in prod). Connection factory in `db/connection.py` must abstract this. Turso requires `TURSO_URL` and `TURSO_AUTH_TOKEN` env vars in prod.

---

## ADR-005 — Embeddings: sentence-transformers (local, all-MiniLM-L6-v2)

**Decision:** Local `sentence-transformers` model (`all-MiniLM-L6-v2`, 384 dimensions).

**Context:** Embedding model for semantic similarity between protocol descriptions and curated methods.

**Pattern baseline:** `patterns.md` → External Integrations (ACL); GoF Strategy (swappable provider).

**Alternatives:** OpenAI `text-embedding-3-small` (API cost per call); Cohere embed (API cost); larger local models (higher accuracy, higher resource use).

**Rationale:** Zero variable cost per query. `all-MiniLM-L6-v2` is well-benchmarked for semantic similarity. At 10–20 methods, embedding quality differences between models are unlikely to be decisive. The `EmbedderAdapter` ACL means the model can be swapped without touching the service layer.

**Reversibility:** Easy (swap the adapter implementation).

**Consequences:** Model download (~90MB) must happen at Render build time, not at request time.

---

## ADR-006 — Data Access: Repository for Methods, Active Record for User CRUD

**Decision:** Repository pattern for the Methods domain. Active Record for User, Query, Feedback, and Suggestion entities.

**Context:** Data access pattern selection (M2.6).

**Pattern baseline:** `patterns.md` → Data Access.

**Rationale:** The Methods domain has meaningful query logic (cosine similarity, multi-filter search, embedding management) that warrants encapsulation. User/auth/feedback entities are simple CRUD — Active Record is explicitly permitted by `patterns.md` in this case. Applying Repository to all entities at MVP would be premature abstraction (YAGNI).

**Reversibility:** Easy to promote Active Record entities to Repository later.

**Consequences:** `MethodRepository` is the only Repository interface. All other data access uses SQLAlchemy ORM models directly.

---

## ADR-007 — Layered Architecture with Dependency Inversion at Service/Adapter boundary

**Decision:** Strict Layered architecture; `ExtractionService` and `RetrievalService` receive adapter instances via constructor injection (manual injection, no DI container).

**Context:** Module boundary design (M2.9).

**Pattern baseline:** `patterns.md` → Module Boundaries.

**Rationale:** The two external I/O dependencies (Anthropic API, sentence-transformers) must be injectable to keep services unit-testable. This directly enables testing assumption H3 (extraction precision) — the highest-risk assumption in the project — with a mock LLM adapter.

**Reversibility:** Easy.

**Consequences:** Route handlers instantiate adapters and inject them into services. No DI container at MVP (YAGNI).

