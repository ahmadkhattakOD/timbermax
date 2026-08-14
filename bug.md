# Bug: Duplicate delivery/truck charges on invoice PDFs

## Reported
Customer PDFs were showing "Delivery Charges" twice (2x) on some invoices
(INV-0815, INV-0817, INV-0818, INV-0827), even after the extra "Delivery
Charges" item was deleted from the Items list, leaving only one delivery item
and one truck-load item in the catalog.

## Cause
Invoice lines store a frozen snapshot (name/price) of the item at the moment
they're added, and are linked to the catalog item by `item_id`. Deleting an
item from the Items list does **not** remove it from invoices that already
used it — it only clears the `item_id` link and leaves the line (with its
frozen name) in place, by design (`supabase/add_item_snapshot.sql`), so that
deleting/editing a catalog item never silently changes a past invoice.

So invoices that had the old duplicate "Delivery Charges" item added *and*
the new one added both kept a line — deleting the item from Items only
stopped it from being picked again going forward, it didn't touch invoices
that already had both lines.

## Fix
- **Existing invoices:** `supabase/fix_duplicate_delivery_charges.sql` finds
  delivery/truck lines duplicated on the same invoice, removes the leftover
  one, and recalculates that invoice's total. Run in the Supabase SQL editor
  (steps and safety notes are in the file — nothing is saved until `COMMIT`).
- **Going forward:** since the Items list now has only one delivery and one
  truck-load item, new invoices won't duplicate this way. The item picker
  still doesn't stop someone from adding two items that happen to share a
  name, so it can recur if a duplicate-named item is ever created again in
  Items.
