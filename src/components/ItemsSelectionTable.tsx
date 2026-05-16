import React from "react";
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  Alert,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Trash } from "iconsax-react";
import { GripVertical } from "lucide-react";
import InputDropdown from "components/InputDropdown";
import { calculateItemTotal, formatCurrency, calculateItemSubtotal, calculateItemGst } from "utils/calculateTotals";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Warehouse {
  id: number;
  name: string;
  available: number;
}

interface Item {
  id?: number;
  name: string;
  itemCode: string;
  quantity: string;
  unit_price: number;
  gst: boolean;
  warehouse_id?: number;
  available_warehouses: Warehouse[];
}

interface ItemsSelectionTableProps {
  items: any[];
  selectedItems: Item[];
  addItem: (itemId: number) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: string, value: any) => void;
  reorderItems: (newItems: any[]) => void;
  totalAmount: number;
  loadingItems: boolean;
  handleItemSearchDebounced: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedItemId: number | null;
  setSelectedItemId: (id: number | null) => void;
  showDiscount?: boolean;
  discount?: number;
  setDiscount?: (value: number) => void;
  discountType?: "percentage" | "fixed";
  setDiscountType?: (value: "percentage" | "fixed") => void;
  showDiscountInput?: boolean;
  setShowDiscountInput?: (value: boolean) => void;
  discountAmount?: number;
  finalAmount?: number;
  deposit?: number;
  setDeposit?: (value: number) => void;
}

// ── Sortable row ──────────────────────────────────────────────────────────────

interface SortableRowProps {
  id: string;
  item: any;
  index: number;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: string, value: any) => void;
}

function SortableRow({ id, item, index, removeItem, updateItem }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? "#f0f4ff" : undefined,
  };

  const selectedWarehouse = item.warehouse_id
    ? item.available_warehouses.find((w: Warehouse) => w.id === item.warehouse_id)
    : null;
  const availableStock = selectedWarehouse?.available || 0;
  const currentQuantity = parseFloat(item.quantity);
  const isLowStock = !!selectedWarehouse && currentQuantity > availableStock;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      sx={{ backgroundColor: isLowStock ? "rgba(255, 165, 0, 0.05)" : "inherit" }}
    >
      {/* Drag handle */}
      <TableCell sx={{ width: 32, px: 0.5, cursor: "grab" }} {...attributes} {...listeners}>
        <GripVertical size={18} style={{ color: "#aaa", display: "block" }} />
      </TableCell>
      <TableCell>{item.name}</TableCell>
      <TableCell>{item.itemCode}</TableCell>
      <TableCell>
        <FormControl size="small" sx={{ minWidth: 120 }} error={!item.warehouse_id}>
          <Select
            value={item.warehouse_id || ""}
            onChange={(e) => updateItem(index, "warehouse_id", Number(e.target.value))}
            displayEmpty
            disabled={item.available_warehouses.length === 1}
          >
            <MenuItem value="" disabled>Select Warehouse</MenuItem>
            {item.available_warehouses.map((warehouse: Warehouse) => (
              <MenuItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.available} available)
              </MenuItem>
            ))}
          </Select>
          {!item.warehouse_id && (
            <Typography variant="caption" color="error">Required</Typography>
          )}
        </FormControl>
      </TableCell>
      <TableCell>
        {selectedWarehouse ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              color={availableStock < 0 ? "error" : isLowStock ? "warning" : "success"}
              fontWeight={isLowStock ? "bold" : "normal"}
            >
              {availableStock}
            </Typography>
            {isLowStock && (
              <Chip label="Low" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">Select warehouse</Typography>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <input
            id={`items[${index}].quantity`}
            name={`items[${index}].quantity`}
            type="number"
            value={item.quantity}
            onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))}
            style={{
              width: "80px",
              padding: "8px",
              border: `1px solid ${isLowStock ? "#ff9800" : "#ccc"}`,
              borderRadius: "4px",
              backgroundColor: isLowStock ? "#fffaf0" : "white",
            }}
            min={1}
          />
          {isLowStock && (
            <Typography variant="caption" color="warning" sx={{ display: "block", mt: 0.5 }}>
              Will create negative stock
            </Typography>
          )}
        </Box>
      </TableCell>
      <TableCell>
        <input
          id={`items[${index}].unit_price`}
          name={`items[${index}].unit_price`}
          type="number"
          value={item.unit_price}
          onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
          style={{ width: "100px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          min={0}
          step="0.01"
        />
      </TableCell>
      <TableCell>{item.gst ? "Yes" : "No"}</TableCell>
      <TableCell>{formatCurrency(calculateItemTotal(item))}</TableCell>
      <TableCell>
        <IconButton onClick={() => removeItem(index)}>
          <Trash size={20} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ItemsSelectionTable({
  items,
  selectedItems,
  addItem,
  removeItem,
  updateItem,
  reorderItems,
  totalAmount,
  loadingItems,
  handleItemSearchDebounced,
  selectedItemId,
  setSelectedItemId,
  showDiscount = false,
  discount = 0,
  setDiscount,
  discountType = "percentage",
  setDiscountType,
  showDiscountInput = false,
  setShowDiscountInput,
  discountAmount = 0,
  finalAmount,
  deposit = 0,
  setDeposit,
}: ItemsSelectionTableProps) {
  const [inputKey, setInputKey] = React.useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const lowStockItems = selectedItems.filter((item) => {
    if (item.warehouse_id) {
      const w = item.available_warehouses.find((w: Warehouse) => w.id === item.warehouse_id);
      return w && parseFloat(item.quantity) > w.available;
    }
    return false;
  });

  const subtotalExGst = selectedItems.reduce((s, i) => s + calculateItemSubtotal(i), 0);
  const gstAmount = selectedItems.reduce((s, i) => s + calculateItemGst(i), 0);
  const subtotalIncGst = subtotalExGst + gstAmount;

  // Stable IDs for dnd-kit — use index-based key so reorder works even without unique ids
  const rowIds = selectedItems.map((_, i) => `row-${i}`);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rowIds.indexOf(active.id as string);
    const newIndex = rowIds.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderItems(arrayMove(selectedItems, oldIndex, newIndex));
    }
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Item Selection */}
      <Box sx={{ mb: 2 }}>
        <InputDropdown
          key={`item_search_${inputKey}`}
          id="item_search"
          name="item_search"
          label="Select Item"
          options={items}
          value={items.find((item) => item.id === selectedItemId) || null}
          loading={loadingItems}
          optional={false}
          onChange={handleItemSearchDebounced}
          onSelect={(e) => {
            const itemId = parseInt(e.target.value);
            if (itemId) {
              addItem(itemId);
              setSelectedItemId(null);
              setInputKey((prev) => prev + 1);
            }
          }}
        />
      </Box>

      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body1" fontWeight="bold">Low Stock Alert</Typography>
            <Typography variant="body2">
              {lowStockItems.length} item(s) will have insufficient stock.{" "}
              {showDiscount ? "Invoice" : "Quotation"} will still be created.
            </Typography>
          </Box>
        </Alert>
      )}

      {selectedItems.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No items added yet. Select an item and click "Add" to add items.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 32, px: 0.5 }} />
                <TableCell>Item</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell>Available</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>GST</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {selectedItems.map((item, index) => (
                    <SortableRow
                      key={rowIds[index]}
                      id={rowIds[index]}
                      item={item}
                      index={index}
                      removeItem={removeItem}
                      updateItem={updateItem}
                    />
                  ))}

                  {/* Subtotal (ex GST) */}
                  <TableRow>
                    <TableCell colSpan={8} align="right"><strong>Subtotal (ex GST):</strong></TableCell>
                    <TableCell><strong>{formatCurrency(subtotalExGst)}</strong></TableCell>
                    <TableCell />
                  </TableRow>

                  {/* GST */}
                  <TableRow>
                    <TableCell colSpan={8} align="right"><strong>GST (10%):</strong></TableCell>
                    <TableCell><strong>{formatCurrency(gstAmount)}</strong></TableCell>
                    <TableCell />
                  </TableRow>

                  {/* Subtotal inc GST */}
                  <TableRow>
                    <TableCell colSpan={8} align="right"><strong>Subtotal (inc GST):</strong></TableCell>
                    <TableCell><strong>{formatCurrency(subtotalIncGst)}</strong></TableCell>
                    <TableCell />
                  </TableRow>

                  {/* Discount */}
                  {showDiscount && (
                    <TableRow>
                      <TableCell colSpan={8} align="right">
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                          <strong>Discount:</strong>
                          {!showDiscountInput && setShowDiscountInput && (
                            <Button size="small" variant="outlined" onClick={() => setShowDiscountInput(true)} sx={{ ml: 1 }}>
                              Add Discount
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {showDiscountInput && setDiscount && setShowDiscountInput ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            {setDiscountType && (
                              <ToggleButtonGroup
                                value={discountType}
                                exclusive
                                size="small"
                                onChange={(_, newType) => {
                                  if (newType) { setDiscountType(newType); setDiscount(0); }
                                }}
                              >
                                <ToggleButton value="percentage" sx={{ px: 1.5, py: 0.5, fontSize: "0.8rem" }}>%</ToggleButton>
                                <ToggleButton value="fixed" sx={{ px: 1.5, py: 0.5, fontSize: "0.8rem" }}>$</ToggleButton>
                              </ToggleButtonGroup>
                            )}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              {discountType === "fixed" && <Typography variant="body2">$</Typography>}
                              <input
                                type="number"
                                value={discount}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (e.target.value === "") { setDiscount(0); }
                                  else if (discountType === "percentage") { if (v >= 0 && v <= 100) setDiscount(v); }
                                  else { if (v >= 0) setDiscount(v); }
                                }}
                                style={{ width: "70px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                                min={0}
                                max={discountType === "percentage" ? 100 : undefined}
                                step="0.01"
                                placeholder={discountType === "percentage" ? "%" : "$"}
                              />
                              {discountType === "percentage" && <Typography variant="body2">%</Typography>}
                            </Box>
                            <strong>-{formatCurrency(discountAmount)}</strong>
                            <IconButton size="small" onClick={() => { setDiscount(0); setShowDiscountInput(false); }}>
                              <Trash size={16} />
                            </IconButton>
                          </Box>
                        ) : (
                          <strong>{formatCurrency(0)}</strong>
                        )}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}

                  {/* Total */}
                  <TableRow>
                    <TableCell colSpan={8} align="right">
                      <Typography variant="h6"><strong>Total:</strong></Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6">
                        <strong>{formatCurrency(showDiscount && finalAmount !== undefined ? finalAmount : totalAmount)}</strong>
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>

                  {/* Deposit */}
                  {showDiscount && setDeposit && (
                    <TableRow>
                      <TableCell colSpan={8} align="right"><strong>Deposit:</strong></TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Typography variant="body2">$</Typography>
                          <input
                            type="number"
                            value={deposit}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              setDeposit(isNaN(v) || v < 0 ? 0 : v);
                            }}
                            style={{ width: "100px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                          />
                        </Box>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}

                  {/* Balance Due */}
                  {showDiscount && deposit > 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="right">
                        <Typography variant="h6" color="primary"><strong>Balance Due:</strong></Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary">
                          <strong>{formatCurrency((showDiscount && finalAmount !== undefined ? finalAmount : totalAmount) - deposit)}</strong>
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </SortableContext>
            </DndContext>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
