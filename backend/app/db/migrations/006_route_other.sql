-- db/migrations/006_route_other.sql
-- Add controlled route value `other` for unmapped administration routes.

INSERT INTO routes (code, name_en, name_pt, description_en, description_pt, sort_order)
SELECT
    'other',
    'Other',
    'Outra',
    'Any chemical administration route not covered by the controlled list.',
    'Qualquer via de administração química não coberta pela lista controlada.',
    80
WHERE NOT EXISTS (
    SELECT 1 FROM routes WHERE code = 'other'
);
