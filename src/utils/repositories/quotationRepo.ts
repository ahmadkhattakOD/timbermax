import { ValuesFilterQuotations } from "types";
import { getDateFormattedForField } from "utils/helpers";
import supabase from "utils/supabase";

export interface QuotationSupabase {
  id?: number;
  quotation_number: string;
  customer_id: number;
  total: number;
  status?: "draft" | "sent" | "accepted" | "converted" | "cancelled";
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
          customer:customer_id(*),
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
          query.ilike(
            `quotation_items.items.name`,
            `%${filters.item_name}%`
          );
        }
        if (filters.item_code) {
          query.ilike(
            `quotation_items.items.itemCode`,
            `%${filters.item_code}%`
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

  public async updateStatus(id: number, status: "draft" | "sent" | "accepted" | "converted" | "cancelled") {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({ 
          status: status, 
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating quotation status:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error updating quotation status:", error);
      return null;
    }
  }

  public async edit(id: number, quotation: Partial<QuotationSupabase>) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({
          ...quotation,
          updated_at: new Date().toISOString()
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

  public async updateItem(quotationId: number, itemId: number, updates: Partial<QuotationItemSupabase>) {
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
          const quantity = updates.quantity !== undefined ? updates.quantity : currentItem.quantity;
          const unit_price = updates.unit_price !== undefined ? updates.unit_price : currentItem.unit_price;
          finalUpdates.total_price = quantity * unit_price;
        }
      }
      
      const { data, error } = await supabase
        .from(this.itemsClassName)
        .update({
          ...finalUpdates,
          updated_at: new Date().toISOString()
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
      // Calculate new total from items
      const { data: items, error: itemsError } = await supabase
        .from(this.itemsClassName)
        .select("quantity, unit_price")
        .eq("quotation_id", quotationId);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      const total = items?.reduce((sum, item) => 
        sum + (parseFloat(item.quantity.toString()) * parseFloat(item.unit_price.toString())), 0) || 0;

      // Update quotation total
      const { error: updateError } = await supabase
        .from(this.className)
        .update({
          total: total,
          updated_at: new Date().toISOString()
        })
        .eq("id", quotationId);

      return { 
        success: !updateError, 
        error: updateError?.message,
        total 
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