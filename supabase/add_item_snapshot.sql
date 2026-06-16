-- Freezes line-item details onto invoice_items / quotation_items at the row level
-- so that editing, renaming, or DELETING the source `items` record never alters
-- or removes a previously-issued invoice or quotation.
--
-- Two-part fix:
--   1. Snapshot columns (item_name/item_code/item_sell_price/item_gst) hold a copy
--      of the item data as it was when the line was added. Readers prefer these.
--   2. The FK invoice_items.item_id -> items.id is changed from ON DELETE CASCADE
--      to ON DELETE SET NULL, and item_id is made nullable. Deleting an item now
--      nulls the link but KEEPS the line row (with its snapshot intact).
--
-- Run once on the Supabase database (SQL editor). Idempotent.

-- ============================================================
-- 1. Snapshot columns
-- ============================================================
ALTER TABLE invoice_items   ADD COLUMN IF NOT EXISTS item_name       text;
ALTER TABLE invoice_items   ADD COLUMN IF NOT EXISTS item_code       text;
ALTER TABLE invoice_items   ADD COLUMN IF NOT EXISTS item_sell_price numeric;
ALTER TABLE invoice_items   ADD COLUMN IF NOT EXISTS item_gst        boolean;

ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS item_name       text;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS item_code       text;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS item_sell_price numeric;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS item_gst        boolean;

-- ============================================================
-- 2. Backfill snapshots from the live items table for existing rows.
--    Only fills rows whose snapshot is still empty AND whose item still exists.
--    (Rows whose item was already cascade-deleted are unrecoverable here — the
--     line is already gone — but this protects everything going forward.)
-- ============================================================
UPDATE invoice_items AS li
SET item_name       = COALESCE(li.item_name, i.name),
    item_code       = COALESCE(li.item_code, i."itemCode"),
    item_sell_price = COALESCE(li.item_sell_price, i."sellPrice"),
    item_gst        = COALESCE(li.item_gst, i.gst)
FROM items AS i
WHERE li.item_id = i.id
  AND (li.item_name IS NULL OR li.item_code IS NULL
       OR li.item_sell_price IS NULL OR li.item_gst IS NULL);

UPDATE quotation_items AS li
SET item_name       = COALESCE(li.item_name, i.name),
    item_code       = COALESCE(li.item_code, i."itemCode"),
    item_sell_price = COALESCE(li.item_sell_price, i."sellPrice"),
    item_gst        = COALESCE(li.item_gst, i.gst)
FROM items AS i
WHERE li.item_id = i.id
  AND (li.item_name IS NULL OR li.item_code IS NULL
       OR li.item_sell_price IS NULL OR li.item_gst IS NULL);

-- ============================================================
-- 3. Make item_id nullable (SET NULL needs this).
-- ============================================================
ALTER TABLE invoice_items   ALTER COLUMN item_id DROP NOT NULL;
ALTER TABLE quotation_items ALTER COLUMN item_id DROP NOT NULL;

-- ============================================================
-- 4. Replace the FK: drop whatever constraint currently links item_id -> items,
--    re-create it with ON DELETE SET NULL. Constraint name is discovered
--    dynamically so this works regardless of how it was originally named.
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT con.conname, rel.relname AS table_name
    FROM pg_constraint con
    JOIN pg_class rel  ON rel.oid = con.conrelid
    JOIN pg_class fref ON fref.oid = con.confrelid
    WHERE con.contype = 'f'
      AND fref.relname = 'items'
      AND rel.relname IN ('invoice_items', 'quotation_items')
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.table_name, r.conname);
  END LOOP;
END $$;

ALTER TABLE invoice_items
  ADD CONSTRAINT invoice_items_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

ALTER TABLE quotation_items
  ADD CONSTRAINT quotation_items_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;
