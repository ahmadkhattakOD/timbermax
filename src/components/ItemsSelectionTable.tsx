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
import InputDropdown from "components/InputDropdown";
import { calculateItemTotal, formatCurrency, calculateItemSubtotal, calculateItemGst } from "utils/calculateTotals";

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
  totalAmount: number;
  loadingItems: boolean;
  handleItemSearchDebounced: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedItemId: number | null;
  setSelectedItemId: (id: number | null) => void;
  // Optional discount props (for invoices only)
  showDiscount?: boolean;
  discount?: number;
  setDiscount?: (value: number) => void;
  discountType?: "percentage" | "fixed";
  setDiscountType?: (value: "percentage" | "fixed") => void;
  showDiscountInput?: boolean;
  setShowDiscountInput?: (value: boolean) => void;
  discountAmount?: number;
  finalAmount?: number;
  totalAmount?: number;
}

export default function ItemsSelectionTable({
  items,
  selectedItems,
  addItem,
  removeItem,
  updateItem,
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
}: ItemsSelectionTableProps) {
  // State to force input reset
  const [inputKey, setInputKey] = React.useState(0);

  // Calculate low stock items for warning
  const lowStockItems = selectedItems.filter(item => {
    if (item.warehouse_id) {
      const selectedWarehouse = item.available_warehouses.find(
        w => w.id === item.warehouse_id
      );
      const requestedQuantity = parseFloat(item.quantity);
      return selectedWarehouse && requestedQuantity > selectedWarehouse.available;
    }
    return false;
  });

  // Calculate GST breakdown
  const subtotalExGst = selectedItems.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
  const gstAmount = selectedItems.reduce((sum, item) => sum + calculateItemGst(item), 0);
  const subtotalIncGst = subtotalExGst + gstAmount; // This should equal totalAmount

  return (
    <Box sx={{ width: '100%' }}>
      {/* Item Selection Section */}
      <Box
        sx={{
          mb: 2,
        }}
      >
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
              setInputKey(prev => prev + 1); // Force remount to clear input
            }
          }}
        />
      </Box>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" fontWeight="bold">
              Low Stock Alert
            </Typography>
            <Typography variant="body2">
              {lowStockItems.length} item(s) will have insufficient stock. {showDiscount ? 'Invoice' : 'Quotation'} will still be created.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Items Table or Empty State */}
      {selectedItems.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No items added yet. Select an item and click "Add" to add items.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
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
            <TableBody>
              {selectedItems.map((item, index) => {
                const selectedWarehouse = item.warehouse_id
                  ? item.available_warehouses.find(w => w.id === item.warehouse_id)
                  : null;

                const availableStock = selectedWarehouse?.available || 0;
                const currentQuantity = parseFloat(item.quantity);
                const isLowStock = availableStock < currentQuantity;

                return (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: isLowStock ? 'rgba(255, 165, 0, 0.05)' : 'inherit'
                    }}
                  >
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.itemCode}</TableCell>
                    <TableCell>
                      <FormControl
                        size="small"
                        sx={{ minWidth: 120 }}
                        error={!item.warehouse_id}
                      >
                        <Select
                          value={item.warehouse_id || ''}
                          onChange={(e) => updateItem(index, "warehouse_id", Number(e.target.value))}
                          displayEmpty
                          disabled={item.available_warehouses.length === 1}
                        >
                          <MenuItem value="" disabled>
                            Select Warehouse
                          </MenuItem>
                          {item.available_warehouses.map((warehouse) => (
                            <MenuItem
                              key={warehouse.id}
                              value={warehouse.id}
                            >
                              {warehouse.name} ({warehouse.available} available)
                            </MenuItem>
                          ))}
                        </Select>
                        {!item.warehouse_id && (
                          <Typography variant="caption" color="error">
                            Required
                          </Typography>
                        )}
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {selectedWarehouse ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            color={availableStock < 0 ? "error" : availableStock < currentQuantity ? "warning" : "success"}
                            fontWeight={availableStock < currentQuantity ? "bold" : "normal"}
                          >
                            {availableStock}
                          </Typography>
                          {isLowStock && (
                            <Chip
                              label="Low"
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Select warehouse
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <input
                          id={`items[${index}].quantity`}
                          name={`items[${index}].quantity`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            updateItem(
                              index,
                              "quantity",
                              parseFloat(e.target.value),
                            );
                          }}
                          style={{
                            width: "80px",
                            padding: "8px",
                            border: `1px solid ${isLowStock ? '#ff9800' : '#ccc'}`,
                            borderRadius: "4px",
                            backgroundColor: isLowStock ? '#fffaf0' : 'white'
                          }}
                          min={1}
                        />
                        {isLowStock && (
                          <Typography
                            variant="caption"
                            color="warning"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
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
                        onChange={(e) =>
                          updateItem(
                            index,
                            "unit_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        style={{
                          width: "100px",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                        min={0}
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>{item.gst ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {formatCurrency(calculateItemTotal(item))}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => removeItem(index)}>
                        <Trash size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Subtotal (ex GST) Row */}
              <TableRow>
                <TableCell colSpan={7} align="right">
                  <strong>Subtotal (ex GST):</strong>
                </TableCell>
                <TableCell>
                  <strong>{formatCurrency(subtotalExGst)}</strong>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* GST Row */}
              <TableRow>
                <TableCell colSpan={7} align="right">
                  <strong>GST (10%):</strong>
                </TableCell>
                <TableCell>
                  <strong>{formatCurrency(gstAmount)}</strong>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Subtotal (inc GST) Row */}
              <TableRow>
                <TableCell colSpan={7} align="right">
                  <strong>Subtotal (inc GST):</strong>
                </TableCell>
                <TableCell>
                  <strong>{formatCurrency(subtotalIncGst)}</strong>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Discount Row (only for invoices) */}
              {showDiscount && (
                <TableRow>
                  <TableCell colSpan={7} align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      <strong>Discount:</strong>
                      {!showDiscountInput && setShowDiscountInput && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setShowDiscountInput(true)}
                          sx={{ ml: 1 }}
                        >
                          Add Discount
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {showDiscountInput && setDiscount && setShowDiscountInput ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {/* Type toggle */}
                        {setDiscountType && (
                          <ToggleButtonGroup
                            value={discountType}
                            exclusive
                            size="small"
                            onChange={(_, newType) => {
                              if (newType) {
                                setDiscountType(newType);
                                setDiscount(0);
                              }
                            }}
                          >
                            <ToggleButton value="percentage" sx={{ px: 1.5, py: 0.5, fontSize: '0.8rem' }}>
                              %
                            </ToggleButton>
                            <ToggleButton value="fixed" sx={{ px: 1.5, py: 0.5, fontSize: '0.8rem' }}>
                              $
                            </ToggleButton>
                          </ToggleButtonGroup>
                        )}
                        {/* Discount value input */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {discountType === "fixed" && (
                            <Typography variant="body2">$</Typography>
                          )}
                          <input
                            type="number"
                            value={discount}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (e.target.value === '') {
                                setDiscount(0);
                              } else if (discountType === "percentage") {
                                if (value >= 0 && value <= 100) setDiscount(value);
                              } else {
                                if (value >= 0) setDiscount(value);
                              }
                            }}
                            style={{
                              width: "70px",
                              padding: "8px",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                            }}
                            min={0}
                            max={discountType === "percentage" ? 100 : undefined}
                            step="0.01"
                            placeholder={discountType === "percentage" ? "%" : "$"}
                          />
                          {discountType === "percentage" && (
                            <Typography variant="body2">%</Typography>
                          )}
                        </Box>
                        <strong>-{formatCurrency(discountAmount)}</strong>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDiscount(0);
                            setShowDiscountInput(false);
                          }}
                        >
                          <Trash size={16} />
                        </IconButton>
                      </Box>
                    ) : (
                      <strong>{formatCurrency(0)}</strong>
                    )}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}

              {/* Final Total Row */}
              <TableRow>
                <TableCell colSpan={7} align="right">
                  <Typography variant="h6">
                    <strong>Total:</strong>
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h6">
                    <strong>{formatCurrency(showDiscount && finalAmount !== undefined ? finalAmount : totalAmount)}</strong>
                  </Typography>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
