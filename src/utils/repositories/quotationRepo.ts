import { ValuesFilterQuotations } from "types";
import { getDateFormattedForField } from "utils/helpers";
import supabase from "utils/supabase";
import StocksRepository from "./stocksRepository";

export interface QuotationSupabase {
  id?: number;
  quotation_number: string;
  customer_id: number;
  total: number;
  discount?: number;
  discount_type?: "percentage" | "fixed";
  status?:
    | "draft"
    | "sent"
    | "accepted"
    | "converted"
    | "cancelled"
    | "approved";
  valid_until?: Date | null;
  note?: string;
  user?: string;
  created_at?: string;
  updated_at?: string;
  // Address snapshot fields - saved with each quotation
  address?: string;
  suburb?: string;
  state?: string;
  post_code?: string;
}

export interface QuotationItemSupabase {
  id?: number;
  quotation_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  total_price?: number;
  warehouse_id?: number; // ADDED
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

class QuotationsRepository {
  private className = "quotations";
  private itemsClassName = "quotation_items";

  public async getNextQuotationNumber(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .select("quotation_number")
        .like("quotation_number", "QT-%")
        .order("quotation_number", { ascending: false });

      if (error || !data || data.length === 0) {
        return "QT-0050";
      }

      let maxNum = 49; // so first generated is 50
      for (const row of data) {
        const match = row.quotation_number?.match(/^QT-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }

      const next = maxNum + 1;
      return `QT-${String(next).padStart(4, "0")}`;
    } catch (error) {
      console.error("Error getting next quotation number:", error);
      return "QT-0050";
    }
  }

  public async create(quotation: QuotationSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert({
          ...quotation,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating quotation:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error creating quotation:", error);
      return null;
    }
  }

  public async get(
    orderBy: string = "created_at",
    ascending: boolean = false,
    rangeStart: number = 0,
    rangeEnd: number = 9,
    limit: number = 10,
    filters?: ValuesFilterQuotations,
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          `*,
          customer:customer_id!inner(*),
          quotation_items(
            *,
            items!inner(
              id,
              name,
              itemCode,
              sellPrice
            )
          )`, // ADDED * to include all fields including warehouse_id
          { count: "exact" },
        )
        .order(orderBy, { ascending: ascending })
        .order("sort_order", {
          referencedTable: this.itemsClassName,
          ascending: true,
        })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      if (filters) {
        if (filters.quotation_number) {
          query.ilike("quotation_number", `%${filters.quotation_number}%`);
        }
        if (filters.customer_name) {
          query.ilike("customer.name", `%${filters.customer_name}%`);
        }
        if (filters.minimumTotal) {
          query.gte("total", parseFloat(filters.minimumTotal));
        }
        if (filters.maximumTotal) {
          query.lte("total", parseFloat(filters.maximumTotal));
        }
        if (filters.status) {
          query.eq("status", filters.status);
        }

        if (filters.created_at_from) {
          query.gte("created_at", filters.created_at_from);
        }
        if (filters.created_at_to) {
          query.lte("created_at", filters.created_at_to);
        }
        if (filters.item_name) {
          query.ilike(`quotation_items.items.name`, `%${filters.item_name}%`);
        }
        if (filters.item_code) {
          query.ilike(
            `quotation_items.items.itemCode`,
            `%${filters.item_code}%`,
          );
        }
      }

      const {
        data: quotationsData,
        count: quotationsCount,
        error: quotationsError,
      } = await query;

      if (quotationsError) {
        console.error("Error fetching quotations:", quotationsError);
        return { quotationsData: [], quotationsCount: 0, quotationsError };
      }

      return { quotationsData, quotationsCount, quotationsError };
    } catch (error) {
      console.error("Error fetching quotations:", error);
      return { quotationsData: [], quotationsCount: 0, quotationsError: error };
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: quotationsData, error: quotationsError } = await supabase
        .from(this.className)
        .select(
          `*,
          customer:customer_id(*)
          `
        )
        .order("created_at", { ascending: false });

      return { quotationsData, quotationsError };
    } catch (error) {
      console.error("Error fetching quotations:", error);
      return { quotationsData: [], quotationsError: error };
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: quotationData, error: quotationError } = await supabase
        .from(this.className)
        .select(
          `*,
          customers!inner(*),
          quotation_items(
            *,
            items!inner(*)
          )`,
        )
        .eq("id", id)
        .order("sort_order", {
          referencedTable: "quotation_items",
          ascending: true,
        })
        .order("id", { referencedTable: "quotation_items", ascending: true })
        .limit(1)
        .maybeSingle();

      return { quotationData, quotationError };
    } catch (error) {
      console.error("Error fetching quotation:", error);
      return { quotationData: null, quotationError: error };
    }
  }

  public async getItems(quotationId: number) {
    try {
      const { data, error } = await supabase
        .from(this.itemsClassName)
        .select(
          `*,
          items!inner(*)`,
        )
        .eq("quotation_id", quotationId)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      return { data, error };
    } catch (error) {
      console.error("Error fetching quotation items:", error);
      return { data: [], error };
    }
  }

  public async addItem(item: QuotationItemSupabase) {
    try {
      const total_price = item.quantity * item.unit_price;

      const { data, error } = await supabase
        .from(this.itemsClassName)
        .insert({
          ...item,
          total_price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding quotation item:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error adding quotation item:", error);
      return null;
    }
  }

  public async updateStatus(
    id: number,
    status: "draft" | "sent" | "approved" | "cancelled" | "converted",
  ) {
    try {
      // Get current status
      const currentQuotation = await this.getSingle(id);
      if (!currentQuotation?.quotationData) {
        return { success: false, error: "Quotation not found" };
      }

      const currentStatus = currentQuotation.quotationData.status;

      // If changing to cancelled from on_hold status, release stock
      if (
        status === "cancelled" &&
        (currentStatus === "draft" ||
          currentStatus === "sent" ||
          currentStatus === "approved")
      ) {
        // Release ALL reserved stock
        const stocksRepo = new StocksRepository();
        const releaseResult = await stocksRepo.releaseAllFromQuotation(id);

        if (!releaseResult.success) {
          console.error("Failed to release stock:", releaseResult.error);
          // Continue with status update but log the error
        }
      }

      // If changing from cancelled back to active, re-reserve stock
      if (
        currentStatus === "cancelled" &&
        (status === "draft" || status === "sent" || status === "approved")
      ) {
        // Get quotation items and re-reserve stock
        const { data: items } = await this.getItems(id);
        if (items) {
          const stocksRepo = new StocksRepository();
          for (const item of items) {
            await stocksRepo.reserveForQuotation(
              item.item_id,
              item.warehouse_id || 1,
              item.quantity,
              id,
            );
          }
        }
      }

      // Update quotation status
      const { data, error } = await supabase
        .from(this.className)
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error("Error updating quotation status:", error);
      return { success: false, error: error.message };
    }
  }

  // When creating a quotation, reserve stock with warehouse support
  public async createWithStockReservation(
    quotation: QuotationSupabase,
    items: Array<{ item_id: number; quantity: number; warehouse_id?: number }>, // UPDATED: Added warehouse_id
  ) {
    try {
      // 1. Create quotation
      const createdQuotation = await this.create(quotation);
      if (!createdQuotation) {
        return { success: false, error: "Failed to create quotation" };
      }

      // 2. Reserve stock for each item with warehouse — run in parallel
      const stocksRepo = new StocksRepository();
      const reservationResults = await Promise.all(
        items.map(async (item) => {
          const warehouseId = item.warehouse_id || 1;
          const reserveResult = await stocksRepo.reserveForQuotation(
            item.item_id,
            warehouseId,
            item.quantity,
            createdQuotation.id,
          );
          if (!reserveResult.success) {
            console.error(
              `Failed to reserve stock for item ${item.item_id} in warehouse ${warehouseId}:`,
              reserveResult.error,
            );
          }
          return {
            itemId: item.item_id,
            warehouseId,
            success: reserveResult.success,
            error: reserveResult.error,
          };
        })
      );

      return {
        success: true,
        quotation: createdQuotation,
        reservations: reservationResults,
      };
    } catch (error: any) {
      console.error("Error creating quotation with stock reservation:", error);
      return { success: false, error: error.message };
    }
  }

  public async edit(id: number, quotation: Partial<QuotationSupabase>) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({
          ...quotation,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error editing quotation:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error editing quotation:", error);
      return null;
    }
  }

  public async delete(ids: readonly number[]) {
    try {
      // First release all stock reservations for each quotation
      const stocksRepo = new StocksRepository();
      for (const id of ids) {
        await stocksRepo.releaseAllFromQuotation(id);
      }

      // Then delete the quotations
      const { data, error } = await supabase
        .from(this.className)
        .delete()
        .in("id", ids)
        .select();

      if (error) {
        console.error("Error deleting quotations:", error);
        return 0;
      }
      return data?.length || 0;
    } catch (error) {
      console.error("Error deleting quotations:", error);
      return 0;
    }
  }

  public async deleteItem(quotationId: number, itemId: number) {
    try {
      // First get the item details to release stock
      const { data: itemData } = await supabase
        .from(this.itemsClassName)
        .select("quantity, warehouse_id")
        .eq("quotation_id", quotationId)
        .eq("item_id", itemId)
        .single();

      if (itemData) {
        // Release the reserved stock
        const stocksRepo = new StocksRepository();
        await stocksRepo.releaseFromQuotation(
          quotationId,
          itemId,
          itemData.warehouse_id || 1,
          itemData.quantity,
        );
      }

      // Then delete the item
      const { data, error } = await supabase
        .from(this.itemsClassName)
        .delete()
        .eq("quotation_id", quotationId)
        .eq("item_id", itemId)
        .select();

      if (error) {
        console.error("Error deleting quotation item:", error);
        return 0;
      }
      return data?.length || 0;
    } catch (error) {
      console.error("Error deleting quotation item:", error);
      return 0;
    }
  }

  public async updateItem(
    quotationId: number,
    itemId: number,
    updates: Partial<QuotationItemSupabase>,
  ) {
    try {
      // First get current item details
      const { data: currentItem } = await supabase
        .from(this.itemsClassName)
        .select("quantity, unit_price, warehouse_id")
        .eq("quotation_id", quotationId)
        .eq("item_id", itemId)
        .single();

      if (!currentItem) {
        console.error("Item not found");
        return null;
      }

      let finalUpdates = { ...updates };

      // Recalculate total_price if quantity or unit_price changes
      if (updates.quantity !== undefined || updates.unit_price !== undefined) {
        const quantity =
          updates.quantity !== undefined
            ? updates.quantity
            : currentItem.quantity;
        const unit_price =
          updates.unit_price !== undefined
            ? updates.unit_price
            : currentItem.unit_price;
        finalUpdates.total_price = quantity * unit_price;
      }

      // Handle stock movements atomically - only if quantity or warehouse changed
      if (updates.quantity !== undefined || updates.warehouse_id !== undefined) {
        const stocksRepo = new StocksRepository();
        const oldQuantity = currentItem.quantity;
        const newQuantity = updates.quantity !== undefined ? updates.quantity : oldQuantity;
        const oldWarehouseId = currentItem.warehouse_id || 1;
        const newWarehouseId = updates.warehouse_id !== undefined ? updates.warehouse_id : oldWarehouseId;

        // Only proceed if there's an actual change
        if (oldQuantity !== newQuantity || oldWarehouseId !== newWarehouseId) {
          if (oldWarehouseId !== newWarehouseId) {
            // Warehouse changed: use atomic transfer method
            const transferResult = await stocksRepo.transferReservationBetweenWarehouses(
              quotationId,
              itemId,
              oldWarehouseId,
              newWarehouseId,
              oldQuantity,
              newQuantity,
            );
            
            if (!transferResult.success) {
              console.error("Failed to transfer reservation between warehouses:", transferResult.error);
              // Continue with item update but log the error
            }
          } else if (oldQuantity !== newQuantity) {
            // Same warehouse, quantity change: use atomic adjustment
            const adjustResult = await stocksRepo.adjustStockReservation(
              quotationId,
              itemId,
              newWarehouseId,
              oldQuantity,
              newQuantity,
            );
            
            if (!adjustResult.success) {
              console.error("Failed to adjust stock reservation:", adjustResult.error);
              // Continue with item update but log the error
            }
          }
        }
      }

      // Update the item in database
      const { data, error } = await supabase
        .from(this.itemsClassName)
        .update({
          ...finalUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("quotation_id", quotationId)
        .eq("item_id", itemId)
        .select()
        .single();

      if (error) {
        console.error("Error updating quotation item:", error);
        return null;
      }
      
      // Update quotation total
      await this.updateQuotationTotal(quotationId);
      
      return data;
    } catch (error) {
      console.error("Error updating quotation item:", error);
      return null;
    }
  }

  public async updateQuotationTotal(quotationId: number) {
    try {
      // First, get the current discount value and type from the quotation
      const { data: quotationData } = await supabase
        .from(this.className)
        .select("discount, discount_type")
        .eq("id", quotationId)
        .single();

      const discount = quotationData?.discount || 0;
      const discountType: "percentage" | "fixed" = quotationData?.discount_type || "percentage";

      // Calculate new total from items with GST
      const { data: itemsWithGST } = await supabase
        .from(this.itemsClassName)
        .select(
          `
          quantity,
          unit_price,
          items!inner(gst)
        `,
        )
        .eq("quotation_id", quotationId);

      let totalWithGST = 0;
      if (itemsWithGST) {
        itemsWithGST.forEach((item: any) => {
          const quantity = parseFloat(item.quantity);
          const unitPrice = parseFloat(item.unit_price);
          const base = quantity * unitPrice;
          const gst = item.items?.gst ? base * 0.1 : 0;
          totalWithGST += base + gst;
        });
      }

      // Apply discount to get final total
      const discountAmount = discountType === "fixed"
        ? Math.min(discount, totalWithGST)
        : (totalWithGST * discount) / 100;
      const finalTotal = totalWithGST - discountAmount;

      // Update quotation total with discount applied
      const { error: updateError } = await supabase
        .from(this.className)
        .update({
          total: finalTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quotationId);

      return {
        success: !updateError,
        error: updateError?.message,
        total: finalTotal,
      };
    } catch (error: any) {
      console.error("Error updating quotation total:", error);
      return { success: false, error: error.message };
    }
  }

  public async getAvailableStockCount(itemId: number, warehouseId: number = 1) {
    try {
      const { data, error } = await supabase
        .from("stocks")
        .select("quantity, reserved")
        .eq("item", itemId)
        .eq("warehouse", warehouseId)
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: true, totalAvailable: 0 };
      }

      const stock = data[0];
      const quantity = parseFloat(stock.quantity) || 0;
      const reserved = parseFloat(stock.reserved) || 0;
      const totalAvailable = Math.max(0, quantity - reserved);

      return { success: true, totalAvailable };
    } catch (error: any) {
      console.error("Error checking available stock:", error);
      return { success: false, error: error.message };
    }
  }

  public async getByCustomer(
    customerId: number,
    orderBy: string = "created_at",
    ascending: boolean = false,
    rangeStart: number = 0,
    rangeEnd: number = 9,
    limit: number = 10,
    filters?: ValuesFilterQuotations,
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          `*,
        customer:customer_id!inner(*),
        quotation_items(
          *,
          items!inner(
            id,
            name,
            itemCode,
            sellPrice
          )
        )`,
          { count: "exact" },
        )
        .order(orderBy, { ascending: ascending })
        .order("sort_order", {
          referencedTable: this.itemsClassName,
          ascending: true,
        })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("customer_id", customerId);

      if (filters) {
        if (filters.quotation_number) {
          query.ilike("quotation_number", `%${filters.quotation_number}%`);
        }
        if (filters.minimumTotal) {
          query.gte("total", parseFloat(filters.minimumTotal));
        }
        if (filters.maximumTotal) {
          query.lte("total", parseFloat(filters.maximumTotal));
        }
        if (filters.status) {
          query.eq("status", filters.status);
        }

        if (filters.created_at_from) {
          query.gte("created_at", filters.created_at_from);
        }
        if (filters.created_at_to) {
          query.lte("created_at", filters.created_at_to);
        }
        if (filters.item_name) {
          query.ilike(`quotation_items.items.name`, `%${filters.item_name}%`);
        }
        if (filters.item_code) {
          query.ilike(
            `quotation_items.items.itemCode`,
            `%${filters.item_code}%`,
          );
        }
      }

      const {
        data: quotationsData,
        count: quotationsCount,
        error: quotationsError,
      } = await query;

      if (quotationsError) {
        console.error("Error fetching customer quotations:", quotationsError);
        return { quotationsData: [], quotationsCount: 0, quotationsError };
      }

      return { quotationsData, quotationsCount, quotationsError };
    } catch (error) {
      console.error("Error fetching customer quotations:", error);
      return { quotationsData: [], quotationsCount: 0, quotationsError: error };
    }
  }

  public async getActive() {
    try {
      const { data: quotationsData, error: quotationsError } = await supabase
        .from(this.className)
        .select("*")
        .not("status", "in", "('converted', 'cancelled')")
        .order("created_at", { ascending: false });

      return { quotationsData, quotationsError };
    } catch (error) {
      console.error("Error fetching active quotations:", error);
      return { quotationsData: [], quotationsError: error };
    }
  }

  // NEW METHOD: Check stock availability for multiple items
  public async checkStockAvailability(
    items: Array<{ item_id: number; quantity: number; warehouse_id?: number }>,
  ) {
    try {
      const availabilityResults = [];
      const stocksRepo = new StocksRepository();

      for (const item of items) {
        const warehouseId = item.warehouse_id || 1;
        const result = await stocksRepo.canReserveStock(
          item.item_id,
          warehouseId,
          item.quantity,
        );

        availabilityResults.push({
          item_id: item.item_id,
          warehouse_id: warehouseId,
          quantity: item.quantity,
          ...result,
        });
      }

      return {
        success: true,
        results: availabilityResults,
        allAvailable: availabilityResults.every((r) => r.canReserve),
      };
    } catch (error: any) {
      console.error("Error checking stock availability:", error);
      return { success: false, error: error.message };
    }
  }
}

export default QuotationsRepository;