-- ADR-023: drop category_3r after rationales are filled (step 4 of 4).
-- NOT auto-applied by migrate.py — run only via:
--   python scripts/backfill_3r_rationales.py --apply-drop
-- Apply only when the gate query returns zero rows.
-- Placeholder text does not count as filled.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM methods
    WHERE (category_3r @> '["replacement"]'::jsonb
           AND (replacement_rationale IS NULL
                OR replacement_rationale = '[PENDENTE — ver category_3r]'))
       OR (category_3r @> '["reduction"]'::jsonb
           AND (reduction_rationale IS NULL
                OR reduction_rationale = '[PENDENTE — ver category_3r]'))
       OR (category_3r @> '["refinement"]'::jsonb
           AND (refinement_rationale IS NULL
                OR refinement_rationale = '[PENDENTE — ver category_3r]'))
  ) THEN
    RAISE EXCEPTION
      'Cannot drop category_3r: pending rationale placeholders remain. '
      'Run scripts/backfill_3r_rationales.py --check and fill all [PENDENTE] values first.';
  END IF;
END $$;

DROP INDEX IF EXISTS idx_methods_category_3r;

ALTER TABLE methods DROP COLUMN category_3r;
