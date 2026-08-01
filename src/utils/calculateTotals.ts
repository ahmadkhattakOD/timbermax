/**
 * Utility functions for calculating invoice/quotation totals with GST and discounts
 */

import { roundAmount } from "./helpers";

export interface ItemForCalculation {
  quantity: number | string;
  unit_price: number | string;
  gst: boolean;
}

export interface TotalBreakdown {
  subtotal: number;  // Sum of all items (qty × price)
  gstAmount: number; // Total GST (10% on GST items)
  subtotalWithGst: number; // Subtotal + GST
  discountType: "percentage" | "fixed"; // How discount was applied
  discountPercentage: number; // Discount % (only meaningful for percentage type)
  discountValue: number; // The raw discount value as entered (% or $)
  discountAmount: number; // Discount in dollars
  finalTotal: number; // After discount
}

/**
 * Calculate the total for a single item (quantity × unit_price)
 * @param item - Item with quantity and unit_price
 * @returns Base total without GST
 */
export function calculateItemSubtotal(item: ItemForCalculation): number {
  const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
  const unitPrice = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price;
  return roundAmount((quantity || 0) * (unitPrice || 0));
}

/**
 * Calculate the GST amount for a single item (10% if GST applicable)
 * @param item - Item with quantity, unit_price, and gst flag
 * @returns GST amount
 */
export function calculateItemGst(item: ItemForCalculation): number {
  if (!item.gst) return 0;
  const subtotal = calculateItemSubtotal(item);
  return roundAmount(subtotal * 0.1); // 10% GST
}

/**
 * Calculate the total for a single item including GST
 * @param item - Item with quantity, unit_price, and gst flag
 * @returns Total including GST
 */
export function calculateItemTotal(item: ItemForCalculation): number {
  const subtotal = calculateItemSubtotal(item);
  const gst = calculateItemGst(item);
  return roundAmount(subtotal + gst);
}

/**
 * Calculate complete breakdown of totals for multiple items with optional discount
 * @param items - Array of items
 * @param discountValue - Discount value (% or $ amount), defaults to 0
 * @param discountType - "percentage" or "fixed", defaults to "percentage"
 * @returns Complete breakdown of totals
 */
export function calculateTotalBreakdown(
  items: ItemForCalculation[],
  discountValue: number = 0,
  discountType: "percentage" | "fixed" = "percentage"
): TotalBreakdown {
  // Calculate subtotal (sum of qty × price for all items, no GST yet)
  const subtotal = roundAmount(
    items.reduce((sum, item) => {
      return sum + calculateItemSubtotal(item);
    }, 0)
  );

  // Calculate total GST amount
  const gstAmount = roundAmount(
    items.reduce((sum, item) => {
      return sum + calculateItemGst(item);
    }, 0)
  );

  // Subtotal + GST
  const subtotalWithGst = roundAmount(subtotal + gstAmount);

  // Calculate discount based on type
  let discountAmount: number;
  let discountPercentage: number;

  if (discountType === "fixed") {
    discountAmount = roundAmount(
      Math.min(Math.max(0, discountValue || 0), subtotalWithGst)
    );
    discountPercentage =
      subtotalWithGst > 0
        ? roundAmount((discountAmount / subtotalWithGst) * 100)
        : 0;
  } else {
    const validPercent = Math.max(0, Math.min(100, discountValue || 0));
    discountAmount = roundAmount((subtotalWithGst * validPercent) / 100);
    discountPercentage = validPercent;
  }

  // Final total after discount
  const finalTotal = roundAmount(subtotalWithGst - discountAmount);

  return {
    subtotal,
    gstAmount,
    subtotalWithGst,
    discountType,
    discountPercentage,
    discountValue: discountValue || 0,
    discountAmount,
    finalTotal,
  };
}

/**
 * Format a number as currency (A$)
 * @param amount - Amount to format
 * @returns Formatted string with 2 decimal places
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
