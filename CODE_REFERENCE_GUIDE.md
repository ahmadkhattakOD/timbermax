# Code Reference Guide - Invoice & Stock Management

## Quick Navigation

### SCENARIO 1: User Creates a Quotation
📍 **Entry Point:** [src/pages/quotations/create-quotation.tsx](src/pages/quotations/create-quotation.tsx)
↓
🔧 **Hook:** [src/pages/quotations/useCreateQuotation.tsx](src/pages/quotations/useCreateQuotation.tsx)
↓
💾 **Repository:** [src/utils/repositories/quotationRepo.ts](src/utils/repositories/quotationRepo.ts) → `createWithStockReservation()`
↓
📊 **Stock Impact:** `stocksRepo.reserveForQuotation()` - marks stock as reserved

---

### SCENARIO 2A: User Converts Quotation to Invoice
📍 **Entry Point:** Click "Convert to Invoice" in quotations list
↓
📍 **Navigation:** Redirects to `/invoices/create?quotation_id={id}`
↓
🔧 **Hook:** [src/pages/invoices/create/useCreateInvoice.tsx](src/pages/invoices/create/useCreateInvoice.tsx) → `loadFromQuotation()`
↓
✍️ **Form Submission:** [src/pages/invoices/create/create-invoice.tsx](src/pages/invoices/create/create-invoice.tsx) → `onSubmit()`
↓
**In useCreateInvoice.tsx (lines 477-537):**
1. Create invoice record
2. Add invoice items
3. **Transfer reserved stock:** `stocksRepo.transferReservedStockToInvoice(quotationId, invoiceId)`
   - Releases quotation reservations
   - Reduces actual stock quantity
4. Update quotation status to "converted"

---

### SCENARIO 2B: User Creates Direct Invoice (No Quotation)
📍 **Entry Point:** [src/pages/invoices/create/create-invoice.tsx](src/pages/invoices/create/create-invoice.tsx)
↓
🔧 **Hook:** [src/pages/invoices/create/useCreateInvoice.tsx](src/pages/invoices/create/useCreateInvoice.tsx) → `onSubmit()`
↓
**In useCreateInvoice.tsx (lines 560-597):**
1. Prepare items for stock reduction
2. **Call:** `invoicesRepo.createWithStockReduction(invoice, items)`
   - Creates invoice
   - Immediately reduces stock for each item
3. Add invoice items
4. Show success message

---

### SCENARIO 3: User Cancels Invoice ✅ IMPORTANT
📍 **Entry Point:** [src/pages/invoices/main/invoices.tsx](src/pages/invoices/main/invoices.tsx)
↓
🔧 **Hook:** [src/pages/invoices/main/useInvoices.tsx](src/pages/invoices/main/useInvoices.tsx) → `cancelInvoice()`
↓
**In useInvoices.tsx (lines 679-720):**
1. Show confirmation dialog to user
2. Call: `invoicesRepo.cancelInvoice(invoiceId)`
   
**In invoicesRepository.ts (lines 617-660):**
1. Get all items from invoice
2. **For each item:** Call `stocksRepo.restoreStockFromInvoice(itemId, warehouseId, quantity)`
   ```typescript
   // Stock restoration logic:
   const currentQuantity = stockData?.[0]?.quantity || 0;
   const newQuantity = currentQuantity + quantity;  // ← ADD BACK quantity
   ```
3. Update invoice status to "cancelled"
4. Return results
   
3. Show success message: "Invoice cancelled. Stock restored for X items."

**Result:** ✅ Stock is automatically added back to available inventory

---

### SCENARIO 4: User Cancels Quotation
📍 **Entry Point:** [src/pages/quotations/quotation.tsx](src/pages/quotations/quotation.tsx)
↓
🔧 **Hook:** [src/pages/quotations/useQuotationts.tsx](src/pages/quotations/useQuotationts.tsx) → `cancelQuotation()`
↓
**In useQuotationts.tsx (lines 709-774):**
1. Show confirmation dialog
2. Call: `quotationsRepo.updateStatus(quotationId, "cancelled")`
3. Update quotation status only

**⚠️ NOTE:** Currently only updates status. Should also call `releaseReservations()` to free up reserved stock.

---

## Stock Management Repository Functions

### In `stocksRepository.ts`:

#### 1. **Reserve Stock for Quotation**
```typescript
public async reserveForQuotation(
  itemId: number,
  quantity: number,
  quotationId: number
)
```
- Called when quotation is created
- Sets `reserved` field to mark stock as held
- Location: [line ~950](src/utils/repositories/stocksRepository.ts#L950)

#### 2. **Reduce Stock for Invoice**
```typescript
public async reduceStockForInvoice(
  itemId: number,
  quantity: number,
  invoiceId: number
)
```
- Called when direct invoice is created
- Calculates: `newQuantity = currentQuantity - quantity`
- Can result in negative stock (backorder)
- Location: [line 1048](src/utils/repositories/stocksRepository.ts#L1048)

#### 3. **Restore Stock from Invoice** ✅
```typescript
public async restoreStockFromInvoice(
  itemId: number,
  warehouseId: number,
  quantity: number
)
```
- Called when invoice is cancelled
- Calculates: `newQuantity = currentQuantity + quantity`
- Updates or creates stock record
- Location: [line 1128](src/utils/repositories/stocksRepository.ts#L1128)

#### 4. **Transfer Reserved Stock to Invoice**
```typescript
public async transferReservedStockToInvoice(
  quotationId: number,
  invoiceId: number
)
```
- Called when quotation is converted to invoice
- Releases reservations and reduces actual stock
- Location: [line ~1000](src/utils/repositories/stocksRepository.ts)

---

## Invoice Repository Functions

### In `invoicesRepository.ts`:

#### 1. **Create with Stock Reduction**
```typescript
public async createWithStockReduction(
  invoice: InvoiceSupabase,
  items: Array<{ item_id: number; quantity: number }>
)
```
- Creates invoice AND reduces stock in one operation
- Used for direct invoices (not from quotation)
- Location: [line 572](src/utils/repositories/invoicesRepository.ts#L572)

#### 2. **Cancel Invoice** ✅
```typescript
public async cancelInvoice(id: number)
```
- Gets invoice items
- Restores stock for each item
- Updates invoice status to "cancelled"
- **This is what restores your stock!**
- Location: [line 617](src/utils/repositories/invoicesRepository.ts#L617)

---

## Data Flow Visualization

### Creating Quotation → Invoice → Cancelling

```
QUOTATION CREATION
├─ quotationRepo.createWithStockReservation()
│  └─ stocksRepo.reserveForQuotation()
│     Stock: {item_id: 1, quantity: 100, reserved: 20}
│
CONVERT TO INVOICE
├─ invoicesRepo.create() → create invoice
├─ invoicesRepo.addItem() → add items to invoice
├─ stocksRepo.transferReservedStockToInvoice()
│  └─ Release 20 from reserved
│     Reduce quantity by 20
│     Stock: {item_id: 1, quantity: 80, reserved: 0}
└─ quotationsRepo.updateStatus("converted")
│
CANCEL INVOICE
├─ invoicesRepo.cancelInvoice()
│  ├─ Get invoice items (quantity: 20)
│  └─ For each item:
│     └─ stocksRepo.restoreStockFromInvoice()
│        └─ quantity = 80 + 20 = 100
│           Stock: {item_id: 1, quantity: 100, reserved: 0}
└─ Update invoice status to "cancelled"
```

---

## Key Functions You Should Know

| Function | File | Purpose | Stock Impact |
|----------|------|---------|--------------|
| `loadFromQuotation()` | useCreateInvoice.tsx:L248 | Load quotation data into invoice form | None yet |
| `onSubmit()` | useCreateInvoice.tsx:L477 | Create invoice (with/without quotation) | Reduces or transfers stock |
| `cancelInvoice()` | useInvoices.tsx:L679 | Cancel invoice UI handler | Calls repository |
| `cancelInvoice()` | invoicesRepository.ts:L617 | Cancel invoice logic | ✅ **Restores stock** |
| `restoreStockFromInvoice()` | stocksRepository.ts:L1128 | Actually restores stock | ✅ **Adds quantity back** |

---

## Important Variables in useCreateInvoice

```typescript
const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
// If selected, uses CASE 1 (transfer reserved stock)
// If null, uses CASE 2 (direct stock reduction)

const [selectedItems, setSelectedItems] = useState<any[]>([]);
// Array of items with quantities to invoice

const totalAmount = selectedItems.reduce(
  (sum, item) => sum + calculateSubTotal(item),
  0
);
// Total invoice amount
```

---

## Important Variables in useInvoices

```typescript
// Used in cancelInvoice function
const cancelInvoice = async (invoiceId: number) => {
  // Shows confirmation dialog
  if (!window.confirm("Are you sure...")) return;
  
  // Calls the repository cancel function
  const result = await invoicesRepo.cancelInvoice(invoiceId);
  
  // Shows user the result
  if (result?.success) {
    // Refreshes the invoice list
    await getData();
  }
};
```

---

## Summary for You

✅ **Stock cancellation is ALREADY implemented!**

When you cancel an invoice:
1. The system fetches all items in the invoice
2. For each item, it **ADDS the quantity back** to the stock
3. Invoice status changes to "cancelled"
4. Stock table is updated with the restored quantities

The entire flow is straightforward and working as expected.

If you want to see it in action:
- Go to invoices page
- Click the cancel button (X icon or menu action)
- Confirm the dialog
- Stock is automatically restored
- Success message shows number of items restored
