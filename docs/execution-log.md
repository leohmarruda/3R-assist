# Execution Log — 3R Assist

> **Scope:** Narrative deviation rationale only — what changed from the plan, why, and what it cost.
> Status tracking belongs in your task tool (Linear, GitHub Projects, etc.).
> Started at Module 3. Archived at end of each cycle (M4/M5).

---

## M0 — Bootstrap

- Scaffold initialized from Framework v1.5.
- ADR tooling: plain markdown ADRs in `decisions.md` (see ADR-000).
- Scope tier declared: Minimal (see ADR-001).
- Permitted compressions logged: CI optional (smoke-test acceptable); M2.5 passes B/C optional; formal M5 replaceable with 3 informal tests if Fórum Animal network doesn't yield 5 users.
- `patterns.md` initialized and reviewed against expected stack.

## M2 — Specification

- Phases A–D complete.
- ADR-002 to ADR-007 registered (stack, architecture, data access).
- H2 and H5 remain Untested — Phase 1 development blockers.

## M2.5 — UI Design

- Pass A (structure) complete: 6 screens mapped, navigation shape defined.
- Pass B (visual) complete: token system, S1 and S3 in high fidelity.
- Pass C (interactive prototype) omitted — Minimal tier compression; recorded here per ADR-001.

**Spec Sync (M2.5.6) — 5 divergences resolved:**

| ID | Divergence | Resolution |
|---|---|---|
| D1 | S6 not in nav in spec | spec.md 2.3 updated; ADR-008 created |
| D2 | Export visible-but-locked for anonymous not specified | spec.md 2.2 F10 and 2.3 S3 updated; ADR-009 created |
| D3 | Confidence indicator on S2 not in spec | spec.md 2.3 S2 updated; ADR-010 created |
| D4 | Reduced opacity for cards ≤ 65% not in spec | spec.md 2.2 F04 and 2.3 S3 updated; ADR-011 created |
| D5 | "Suggest method" link on S3 not in spec | spec.md 2.3 S3 updated; ADR-012 created |

1 elaboration (no ADR): S3 horizontal filter bar vs S4 sidebar distinction — spec was silent, not contradicted.

**Open question before M3:** visual tone (warm off-white vs. plain white) — show Ethos templates (`entrada_de_protocolo`, `relat_rio_de_an_lise`) to 2–3 researchers/CEUAs in Karynn's network before implementing.

## M2.5 — Ethos theme adoption

- **Decision:** Ethos Research System adopted as canonical visual base (replaces Pass B `pass-b-visual.html` for implementation).
- **Token sync:** `docs/design-tokens.md` reconciled with `UI design templates/Ethos Theme/ethos_research_system/DESIGN.md`. Implementation artifacts: `design/tokens.css`, `design/ethos-theme.css` (Tailwind v4), `design/tailwind.preset.js` (reference).
- **Component inventory:** `design/components.md` — 4 Ethos templates mapped to S1–S6 with P0–P4 priority.
- **Frontend scaffold:** `frontend/` — Vite + React + Tailwind v4, Ethos tokens wired, preview components (`TopNav`, `ResultCard`).

**Token deltas from Pass B:** `--bg` `#F7F6F2` → `#faf9f5`; `--text-2` `#6B6960` → `#494740` (Ethos `on-surface-variant`). Legacy aliases preserved in `design/tokens.css`.

## M3 — Backend scaffold

- `backend/` FastAPI app scaffolded per spec 2.8 (layered: routes → services → adapters/repositories).
- Working endpoints: `GET /health`, `POST /analyze` (stub LLM when `ANTHROPIC_API_KEY` unset).
- SQLite schema in `app/db/schema.sql`; auto-init on startup.
- Smoke test: `backend/scripts/smoke_test.py`. Unit tests: `backend/tests/`.

---

*M3+ entries added during development.*
