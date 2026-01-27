# Invoice & Quotation Stock Management Flow

## Overview
The application has a complete flow for managing stock through quotations and invoices with the ability to cancel and restore stock. Here's how it works:

---

## 1. QUOTATION FLOW (Stock Reservation)

### File: [src/utils/repositories/quotationRepo.ts](src/utils/repositories/quotationRepo.ts#L278)

When a quotation is created, stock is **RESERVED** (not reduced):

```typescript
public async createWithStockReservation(
  quotation: QuotationSupabase,
  items: Array<{ item_id: number; quantity: number }>
)
```

**Process:**
1. Create quotation record in database
2. For each item in the quotation, call `stocksRepo.reserveForQuotation()`
   - This marks stock as "reserved" but doesn't reduce available quantity
   - Reserved stock is held for this specific quotation
3. Return quotation with reservation results

**Stock Table Fields:**
- `quantity`: Actual available stock
- `reserved`: Amount reserved for quotations

---

## 2. INVOICE CREATION FLOW (Stock Reduction)

### File: [src/pages/invoices/create/useCreateInvoice.tsx](src/pages/invoices/create/useCreateInvoice.tsx#L477)

When creating an invoice, there are **TWO scenarios**:

### **SCENARIO A: Invoice from Quotation** ✅
Lines 477-537

When converting a quotation to an invoice:

1. **Create invoice** record
2. **Add invoice items** to the invoice
3. **TRANSFER reserved stock** from quotation to invoice:
   - Call: `stocksRepo.transferReservedStockToInvoice(quotationId, invoiceId)`
   - This releases the quotation's reservations
   - Reduces the actual stock quantity by the reserved amount
4. **Update quotation status** to "converted"

**Stock impact:**
```
Before: quantity = 100, reserved = 50 (for quotation)
After:  quantity = 50 (50 - 50 transferred), reserved = 0
```

### **SCENARIO B: Direct Invoice (No Quotation)** ✅
Lines 560-597

When creating an invoice without a quotation:

1. **Prepare stock reduction** - gather all items and quantities
2. Call: `invoicesRepo.createWithStockReduction(invoice, items)`
3. This:
   - Creates the invoice
   - **Immediately reduces stock** for each item
   - Stock goes directly from available to reduced (no reservation phase)

**Stock impact:**
```
Before: quantity = 100
After:  quantity = 90 (if 10 items invoiced)
```

---

## 3. INVOICE CANCELLATION FLOW (Stock Restoration)

### File: [src/pages/invoices/main/useInvoices.tsx](src/pages/invoices/main/useInvoices.tsx#L679)

When cancelling an invoice:

```typescript
const cancelInvoice = async (invoiceId: number) => {
  // 1. Confirm with user
  // 2. Get all items from invoice
  // 3. Restore stock for each item
  // 4. Update invoice status to "cancelled"
}
```

### Repository Implementation: [src/utils/repositories/invoicesRepository.ts](src/utils/repositories/invoicesRepository.ts#L617)

```typescript
public async cancelInvoice(id: number) {
  // 1. Fetch invoice items
  const itemsResult = await this.getItems(id);
  
  // 2. Restore stock for each item
  for (const item of itemsResult.data) {
    const restoreResult = await stocksRepo.restoreStockFromInvoice(
      item.item_id,
      1, // default warehouse
      item.quantity
    );
  }
  
  // 3. Update invoice status to "cancelled"
  const statusUpdate = await supabase
    .from("invoices")
    .update({ status: "cancelled" })
    .eq("id", id);
}
```

**Stock restoration logic:** [src/utils/repositories/stocksRepository.ts](src/utils/repositories/stocksRepository.ts#L1128)

```typescript
public async restoreStockFromInvoice(
  itemId: number,
  warehouseId: number,
  quantity: number
) {
  // 1. Get current stock
  const currentQuantity = stockData?.[0]?.quantity || 0;
  
  // 2. ADD back the invoiced quantity
  const newQuantity = currentQuantity + quantity;
  
  // 3. Update or create stock record
  if (stockData && stockData.length > 0) {
    // Update existing
    await supabase
      .from("stocks")
      .update({ quantity: newQuantity })
      .eq("id", stockData[0].id);
  } else {
    // Create new
    await supabase
      .from("stocks")
      .insert({ 
        item: itemId, 
        quantity: newQuantity,
        reserved: 0,
        status: "available"
      });
  }
}
```

**Stock restoration impact:**
```
Before cancelling: quantity = 50 (10 items removed from 60)
After cancelling:  quantity = 60 (10 items restored)
```

---

## 4. QUOTATION CANCELLATION FLOW

### File: [src/pages/quotations/useQuotationts.tsx](src/pages/quotations/useQuotationts.tsx#L709)

When cancelling a quotation:

```typescript
async function cancelQuotation(quotationId: number) {
  // Simply updates quotation status to "cancelled"
  const result = await quotationsRepo.updateStatus(quotationId, "cancelled");
}
```

**⚠️ IMPORTANT:** The current implementation only updates the quotation status. 
**It should also release reserved stock**, but this is not currently implemented.

---

## 5. STOCK REDUCTION FOR INVOICES

### File: [src/utils/repositories/stocksRepository.ts](src/utils/repositories/stocksRepository.ts#L1048)

```typescript
public async reduceStockForInvoice(
  itemId: number,
  quantity: number,
  invoiceId: number
)
```

**Process:**
1. Find existing stock record for the item
2. Calculate: `newQuantity = currentQuantity - quantity`
   - **Can go negative** (allows overselling)
3. Update or create stock record
4. Return results

**Stock impact:**
```
Before: quantity = 100
After:  quantity = 90 (if reducing by 10)

If reducing by 110:
Before: quantity = 100
After:  quantity = -10 (negative = backorder)
```

---

## KEY FILES SUMMARY

| File | Purpose | Key Functions |
|------|---------|---|
| [useCreateInvoice.tsx](src/pages/invoices/create/useCreateInvoice.tsx) | Create invoice logic | `onSubmit()` - handles both quotation and direct invoices |
| [useInvoices.tsx](src/pages/invoices/main/useInvoices.tsx) | Invoice management | `cancelInvoice()` - restores stock |
| [useQuotations.tsx](src/pages/quotations/useQuotationts.tsx) | Quotation management | `cancelQuotation()` - releases quotation |
| [invoicesRepository.ts](src/utils/repositories/invoicesRepository.ts) | Invoice DB operations | `createWithStockReduction()`, `cancelInvoice()` |
| [quotationRepo.ts](src/utils/repositories/quotationRepo.ts) | Quotation DB operations | `createWithStockReservation()` |
| [stocksRepository.ts](src/utils/repositories/stocksRepository.ts) | Stock operations | `reduceStockForInvoice()`, `restoreStockFromInvoice()`, `reserveForQuotation()`, `transferReservedStockToInvoice()` |

---

## FLOW DIAGRAMS

### Creating a Quotation → Invoice → Cancelling Invoice

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREATE QUOTATION                                         │
│    Stock: 100 available, 0 reserved                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ reserveForQuotation() │
         │ (Reserve 20 items)    │
         └───────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────┐
    │ Stock: 100 available, 20 reserved│
    └─────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CONVERT QUOTATION → INVOICE                              │
│    Create invoice from quotation                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────┐
    │ transferReservedStockToInvoice() │
    │ Release 20 reserved + reduce qty │
    └──────────────────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────┐
    │ Stock: 80 available, 0 reserved  │
    │ (20 items moved to invoice)      │
    └──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CANCEL INVOICE                                           │
│    Restore stock from invoice                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
     ┌─────────────────────────────┐
     │ restoreStockFromInvoice()    │
     │ Add 20 back to quantity      │
     └─────────────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────┐
    │ Stock: 100 available, 0 reserved │
    │ (Back to original state)         │
    └──────────────────────────────────┘
```

### Creating Direct Invoice (No Quotation)

```
┌──────────────────────────────────┐
│ CREATE DIRECT INVOICE             │
│ Stock: 100 available              │
└────────────┬─────────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │ reduceStockForInvoice()       │
  │ (Reduce by 30 items)          │
  └──────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │ Stock: 70 available           │
  │ (Stock reduced immediately)   │
  └──────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │ CANCEL INVOICE               │
  │ restoreStockFromInvoice()     │
  │ (Add 30 back)                │
  └──────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │ Stock: 100 available          │
  │ (Back to original state)      │
  └──────────────────────────────┘
```

---

## CURRENT STATUS

✅ **Working Features:**
- Quotation stock reservation
- Invoice creation from quotation with stock transfer
- Direct invoice creation with stock reduction
- **Invoice cancellation with stock restoration** ✅

✅ **Stock Restoration is Already Implemented:**
- When you cancel an invoice, the `restoreStockFromInvoice()` function is called
- Stock quantity is increased by the invoice quantity
- This adds back the stock to available inventory

---

## HOW INVOICE CANCELLATION WORKS (Current Implementation)

1. User clicks "Cancel" on an invoice → Shows confirmation dialog
2. If confirmed, calls `invoicesRepo.cancelInvoice(invoiceId)`
3. This function:
   - Fetches all items from the invoice
   - For each item, calls `stocksRepo.restoreStockFromInvoice()`
   - Updates invoice status to "cancelled"
4. Stock is **automatically restored** to available inventory
5. User sees success message: "Invoice cancelled. Stock restored for X items."

---

## SUMMARY

**Your requirement is already implemented!**

When you cancel an invoice:
✅ Stock is automatically added back to available inventory
✅ The system tracks which items were in the invoice
✅ Each item's quantity is restored correctly
✅ User gets confirmation of how many items were restored

The flow is straightforward and exactly as you described - it's an obvious and necessary feature that's already in place.
