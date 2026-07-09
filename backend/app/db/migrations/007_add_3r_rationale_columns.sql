-- ADR-023: add per-R rationale columns (category_3r remains source of truth until 008)
-- Step 1 of 4 — do not combine with DROP in the same migration.

ALTER TABLE methods
  ADD COLUMN IF NOT EXISTS replacement_rationale TEXT,
  ADD COLUMN IF NOT EXISTS reduction_rationale   TEXT,
  ADD COLUMN IF NOT EXISTS refinement_rationale  TEXT;
