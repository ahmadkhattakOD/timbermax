-- Adds a per-line note/description to invoice line items. This is specific to
-- that line on that invoice — it is never written to the `items` master
-- record, so it won't show up on other invoices or on the item itself.
-- Run once on the Supabase database (SQL editor). Idempotent.

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS note text;
