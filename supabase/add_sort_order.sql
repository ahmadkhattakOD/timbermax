-- Adds an explicit display-order column to invoice/quotation line items.
-- Run once on the Supabase database (SQL editor).

ALTER TABLE invoice_items   ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill existing rows: order within each parent by id (current insertion order).
UPDATE invoice_items AS t
SET sort_order = s.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY invoice_id ORDER BY id) AS rn
  FROM invoice_items
) AS s
WHERE t.id = s.id;

UPDATE quotation_items AS t
SET sort_order = s.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY quotation_id ORDER BY id) AS rn
  FROM quotation_items
) AS s
WHERE t.id = s.id;
