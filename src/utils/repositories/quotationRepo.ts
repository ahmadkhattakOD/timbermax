import { ValuesFilterQuotations } from "types";
import { getDateFormattedForField } from "utils/helpers";
import supabase from "utils/supabase";
import StocksRepository from "./stocksRepository";

export interface QuotationSupabase {
  id?: number;
  quotation_number: string;
  customer_id: number;
  total: number;
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
}

export interface QuotationItemSupabase {
  id?: number;
  quotation_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  total_price?: number;
  created_at?: string;
  updated_at?: string;
}

class QuotationsRepository {
  private className = "quotations";
  private itemsClassName = "quotation_items";

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
    filters?: ValuesFilterQuotations
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          `*,
   customer:customer_id!inner(*),
          quotation_items(
            quantity,
            unit_price,
            items!inner(
              id,
              name,
              itemCode,
              sellPrice
            )
          )`,
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
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
        if (filters.valid_until_from) {
          query.gte("valid_until", filters.valid_until_from);
        }
        if (filters.valid_until_to) {
          query.lte("valid_until", filters.valid_until_to);
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
            `%${filters.item_code}%`
          );
        }
      }
      console.log("filterss", filters);
      const {
        data: quotationsData,
        count: quotationsCount,
        error: quotationsError,
      } = await query;
      console.log("DATAA", quotationsData);
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
        .select("*")
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
          )`
        )
        .eq("id", id)
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
          items!inner(*)`
        )
        .eq("quotation_id", quotationId);

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
    status: "draft" | "sent" | "approved" | "cancelled" | "converted"
  ) {
    try {
      // Get current status
      const currentQuotation = await this.getSingle(id);
      console.log("COMING TILL HERE", currentQuotation);
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

  // When creating a quotation, reserve stock
  public async createWithStockReservation(
    quotation: QuotationSupabase,
    items: Array<{ item_id: number; quantity: number }>
  ) {
    try {
      // 1. Create quotation
      const createdQuotation = await this.create(quotation);
      if (!createdQuotation) {
        return { success: false, error: "Failed to create quotation" };
      }

      // 2. Reserve stock for each item
      const stocksRepo = new StocksRepository();
      const reservationResults = [];

      for (const item of items) {
        const reserveResult = await stocksRepo.reserveForQuotation(
          item.item_id,
          1, // default warehouse
          item.quantity,
          createdQuotation.id
        );

        reservationResults.push({
          itemId: item.item_id,
          success: reserveResult.success,
          error: reserveResult.error,
        });

        // If any reservation fails, you might want to rollback
        if (!reserveResult.success) {
          console.error(
            `Failed to reserve stock for item ${item.item_id}:`,
            reserveResult.error
          );
          // Optional: Rollback the quotation creation
          // await this.delete([createdQuotation.id]);
          // return { success: false, error: `Failed to reserve stock for item ${item.item_id}` };
        }
      }

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
    updates: Partial<QuotationItemSupabase>
  ) {
    try {
      let finalUpdates = { ...updates };

      // Recalculate total_price if quantity or unit_price changes
      if (updates.quantity !== undefined || updates.unit_price !== undefined) {
        const { data: currentItem } = await supabase
          .from(this.itemsClassName)
          .select("quantity, unit_price")
          .eq("quotation_id", quotationId)
          .eq("item_id", itemId)
          .single();

        if (currentItem) {
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
      }

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
      return data;
    } catch (error) {
      console.error("Error updating quotation item:", error);
      return null;
    }
  }

  public async updateQuotationTotal(quotationId: number) {
    try {
      // Calculate new total from items (including GST if stored separately)
      const { data: items, error: itemsError } = await supabase
        .from(this.itemsClassName)
        .select("quantity, unit_price")
        .eq("quotation_id", quotationId);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      // This calculates base total without GST
      const baseTotal =
        items?.reduce(
          (sum, item) =>
            sum +
            parseFloat(item.quantity.toString()) *
              parseFloat(item.unit_price.toString()),
          0
        ) || 0;

      // If you need to add GST, you'll need to fetch GST information for each item
      // Option 1: If GST is stored in quotation_items
      const { data: itemsWithGST } = await supabase
        .from(this.itemsClassName)
        .select(
          `
        quantity, 
        unit_price,
        items!inner(gst)
      `
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
      } else {
        totalWithGST = baseTotal;
      }

      // Update quotation total
      const { error: updateError } = await supabase
        .from(this.className)
        .update({
          total: totalWithGST, // Use GST-included total
          updated_at: new Date().toISOString(),
        })
        .eq("id", quotationId);

      return {
        success: !updateError,
        error: updateError?.message,
        total: totalWithGST,
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
    filters?: ValuesFilterQuotations
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          `*,
          customers!inner(*)`,
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
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
        if (filters.valid_until_from) {
          query.gte("valid_until", filters.valid_until_from);
        }
        if (filters.valid_until_to) {
          query.lte("valid_until", filters.valid_until_to);
        }
        if (filters.created_at_from) {
          query.gte("created_at", filters.created_at_from);
        }
        if (filters.created_at_to) {
          query.lte("created_at", filters.created_at_to);
        }
      }

      const {
        data: quotationsData,
        count: quotationsCount,
        error: quotationsError,
      } = await query;

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
}

export default QuotationsRepository;
