import { ValuesFilterStock } from "pages/stock/main/useStock";
import supabase from "utils/supabase";

export interface StockSupabase {
  id?: number;
  item: number;
  warehouse: number;
  quantity: number;
  reserved?: number;
  status?: "available" | "on_hold" | "committed" | "damaged";
  reference_id?: number | null;
  reference_type?: "quotation" | "invoice" | "sales_order" | "none" | null;
  user?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReserveStockParams {
  itemId: number;
  warehouseId: number;
  quantity: number;
  referenceId: number;
  referenceType: "quotation" | "invoice";
}

class StocksRepository {
  private className = "stocks";

  public async create(stock: StockSupabase) {
    try {
      const { data: existingStockData, error: existingStockError } =
        await supabase
          .from(this.className)
          .select("id, quantity, reserved")
          .eq("item", stock.item)
          .eq("warehouse", stock.warehouse)
          .limit(1);

      if (
        existingStockData &&
        existingStockData.length > 0 &&
        !existingStockError
      ) {
        const existingStock = existingStockData[0];
        const { data, error } = await supabase
          .from(this.className)
          .update({
            item: stock.item,
            warehouse: stock.warehouse,
            quantity: stock.quantity + parseFloat(existingStock.quantity),
            reserved: stock.reserved || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingStock.id)
          .select();

        if (data && data.length > 0 && error === null) {
          return data[0];
        }
        return null;
      } else {
        const { data, error } = await supabase
          .from(this.className)
          .insert({
            ...stock,
            reserved: stock.reserved || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (data && data.length > 0 && error === null) {
          return data[0];
        }
        return null;
      }
    } catch (error) {
      console.error("Error creating new stock:", error);
      return null;
    }
  }

public async get(
  orderBy: string,
  ascending: boolean,
  rangeStart: number,
  rangeEnd: number,
  limit: number,
  filters?: ValuesFilterStock
) {
  try {
    const query = supabase
      .from(this.className)
      .select(
        "id, item (id, name, itemCode), warehouse (id, name), quantity, reserved, status, reference_id, reference_type, updated_at",
        { count: "exact" }
      )
      .order(orderBy, { ascending: ascending })
      .range(rangeStart, rangeEnd)
      .limit(limit);

    if (filters) {
      if (filters.item) {
        query.ilike("item.name", `%${filters.item}%`);
      }
      if (filters.warehouse) {
        query.eq("warehouse", filters.warehouse);
      }
      if (filters.status) {
        query.eq("status", filters.status);
      }
      if (filters.minimumQuantity) {
        query.gte("quantity", parseInt(filters.minimumQuantity));
      }
      if (filters.maximumQuantity) {
        query.lte("quantity", parseInt(filters.maximumQuantity));
      }
      if (filters.updatedAtFrom) {
        query.gte("updated_at", filters.updatedAtFrom);
      }
      if (filters.updatedAtTo) {
        query.lte("updated_at", filters.updatedAtTo);
      }
    }

    const {
      data: stocksData,
      count: stocksCount,
      error: stocksError,
    } = await query;

    return { stocksData, stocksCount, stocksError };
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return null;
  }
}

  public async getLowInStock() {
    try {
      const { data: stocksData, error: stocksError } = await supabase
        .from(this.className)
        .select(" id, item ( name ), quantity, reserved ")
        .order("quantity", { ascending: true })
        .limit(5);

      return { stocksData, stocksError };
    } catch (error) {
      console.error("Error fetching stocks:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: stockData, error: stockError } = await supabase
        .from(this.className)
        .select(
          "id, item (id, name), warehouse (id, name), quantity, reserved, status, reference_id, reference_type, updated_at"
        )
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { stockData, stockError };
    } catch (error) {
      console.error("Error fetching stock:", error);
      return null;
    }
  }

  public async getByWarehouse(warehouse: number) {
    try {
      const { data: stocksData, error: stocksError } = await supabase
        .from(this.className)
        .select(
          "id, item (id, name), warehouse (id, name), quantity, reserved, status, updated_at"
        )
        .eq("warehouse", warehouse);

      return { stocksData, stocksError };
    } catch (error) {
      console.error("Error fetching stock:", error);
      return null;
    }
  }

  public async edit(
    id: number,
    stock: StockSupabase,
    changedItemWarehouse: boolean
  ) {
    try {
      if (changedItemWarehouse) {
        const { data: existingStockData, error: existingStockError } =
          await supabase
            .from(this.className)
            .select("id, quantity, reserved")
            .eq("item", stock.item)
            .eq("warehouse", stock.warehouse);

        if (
          existingStockData &&
          existingStockData.length > 0 &&
          !existingStockError
        ) {
          const existingStock = existingStockData[0];
          const { data, error } = await supabase
            .from(this.className)
            .update({
              item: stock.item,
              warehouse: stock.warehouse,
              quantity: stock.quantity + parseFloat(existingStock.quantity),
              reserved: (stock.reserved || 0) + (parseFloat(existingStock.reserved) || 0),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingStock.id)
            .select();

          if (data && data.length > 0 && error === null) {
            await supabase.from(this.className).delete().eq("id", id);
            return data[0];
          }
          return null;
        }
        return null;
      } else {
        const { data, error } = await supabase
          .from(this.className)
          .update({
            ...stock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select();

        if (data && data.length > 0 && error === null) {
          return data[0];
        }
        return null;
      }
    } catch (error) {
      console.error("Error editing stock:", error);
      return null;
    }
  }

  public async move(stock: StockSupabase) {
    try {
      const { data: existingStockData, error: existingStockError } =
        await supabase
          .from(this.className)
          .select("id, quantity, reserved")
          .eq("item", stock.item)
          .eq("warehouse", stock.warehouse);

      if (
        existingStockData &&
        existingStockData.length > 0 &&
        !existingStockError
      ) {
        const existingStock = existingStockData[0];
        const available = parseFloat(existingStock.quantity) - (parseFloat(existingStock.reserved) || 0);
        
        if (stock.quantity > available) {
          return null;
        } else if (stock.quantity == available) {
          const { data, error } = await supabase
            .from(this.className)
            .delete()
            .eq("id", existingStock.id)
            .select();

          if (data && data.length > 0 && error === null) {
            return data[0];
          }
          return null;
        } else {
          const { data, error } = await supabase
            .from(this.className)
            .update({
              item: stock.item,
              warehouse: stock.warehouse,
              quantity: parseFloat(existingStock.quantity) - stock.quantity,
              reserved: parseFloat(existingStock.reserved) || 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingStock.id)
            .select();

          if (data && data.length > 0 && error === null) {
            return data[0];
          }
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error editing stock:", error);
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

      if (data && data.length > 0 && error === null) {
        return data.length;
      }
      return 0;
    } catch (error) {
      console.error("Error deleting stocks:", error);
      return 0;
    }
  }

  // SINGLE ROW STOCK RESERVATION METHODS

  public async reserveForQuotation(
    itemId: number,
    warehouseId: number,
    quantity: number,
    quotationId: number
  ) {
    try {
      // Get current stock record
      const { data: stockData, error: stockError } = await supabase
        .from(this.className)
        .select("id, quantity, reserved")
        .eq("item", itemId)
        .eq("warehouse", warehouseId)
        .limit(1);

      if (stockError) {
        return { success: false, error: "Database error" };
      }

      if (!stockData || stockData.length === 0) {
        return { success: false, error: "No stock record found for this item" };
      }

      const stock = stockData[0];
      const currentQuantity = parseFloat(stock.quantity) || 0;
      const currentReserved = parseFloat(stock.reserved) || 0;
      const available = currentQuantity - currentReserved;

      // Validate available stock
      if (available < quantity) {
        return { 
          success: false, 
          error: `Insufficient stock. Available: ${available}, Requested: ${quantity}`,
          available,
          requested: quantity
        };
      }

      // Increase reserved amount
      const newReserved = currentReserved + quantity;
      
      const { error: updateError } = await supabase
        .from(this.className)
        .update({
          reserved: newReserved,
          status: 'on_hold',
          reference_id: quotationId,
          reference_type: 'quotation',
          updated_at: new Date().toISOString()
        })
        .eq("id", stock.id);

      if (updateError) {
        return { 
          success: false, 
          error: `Failed to update stock: ${updateError.message}` 
        };
      }

      return { 
        success: true, 
        available: available - quantity,
        reserved: newReserved,
        total: currentQuantity
      };
    } catch (error: any) {
      console.error("Error reserving stock:", error);
      return { 
        success: false, 
        error: `System error: ${error.message}` 
      };
    }
  }

  public async releaseFromQuotation(
    quotationId: number,
    itemId: number,
    warehouseId: number,
    quantity: number
  ) {
    try {
      // Get current stock record
      const { data: stockData, error: stockError } = await supabase
        .from(this.className)
        .select("id, quantity, reserved")
        .eq("item", itemId)
        .eq("warehouse", warehouseId)
        .limit(1);

      if (stockError) {
        return { success: false, error: "Database error" };
      }

      if (!stockData || stockData.length === 0) {
        return { 
          success: false, 
          error: "No stock record found for this item" 
        };
      }

      const stock = stockData[0];
      const currentReserved = parseFloat(stock.reserved) || 0;
      const currentQuantity = parseFloat(stock.quantity) || 0;

      // Validate reserved amount
      if (currentReserved < quantity) {
        return { 
          success: false, 
          error: `Cannot release ${quantity}. Only ${currentReserved} reserved.`,
          reserved: currentReserved,
          requested: quantity
        };
      }

      // Decrease reserved amount
      const newReserved = currentReserved - quantity;
      const newStatus = newReserved === 0 ? 'available' : 'on_hold';
      
      const { error: updateError } = await supabase
        .from(this.className)
        .update({
          reserved: newReserved,
          status: newStatus,
          reference_id: newReserved === 0 ? null : quotationId,
          updated_at: new Date().toISOString()
        })
        .eq("id", stock.id);

      if (updateError) {
        return { 
          success: false, 
          error: `Failed to update stock: ${updateError.message}` 
        };
      }

      return { 
        success: true, 
        released: quantity,
        remainingReserved: newReserved,
        available: currentQuantity - newReserved
      };
    } catch (error: any) {
      console.error("Error releasing stock:", error);
      return { 
        success: false, 
        error: `System error: ${error.message}` 
      };
    }
  }

  public async releaseAllFromQuotation(quotationId: number) {
    try {
      // Get all items from the quotation
      const { data: quotationItems, error: itemsError } = await supabase
        .from("quotation_items")
        .select("item_id, quantity")
        .eq("quotation_id", quotationId);

      if (itemsError) {
        return { 
          success: false, 
          error: `Failed to fetch quotation items: ${itemsError.message}` 
        };
      }

      if (!quotationItems || quotationItems.length === 0) {
        return { 
          success: true, 
          message: "No items to release from this quotation" 
        };
      }

      const results = [];
      let totalReleased = 0;
      let allSuccess = true;

      // Release stock for each item
      for (const item of quotationItems) {
        const quantity = parseFloat(item.quantity);
        const result = await this.releaseFromQuotation(
          quotationId,
          item.item_id,
          1, // Default warehouse ID
          quantity
        );
        
        results.push({
          itemId: item.item_id,
          quantity,
          success: result.success,
          error: result.error,
          released: result.success ? quantity : 0
        });
        
        if (result.success) {
          totalReleased += quantity;
        } else {
          allSuccess = false;
          console.error(`Failed to release item ${item.item_id}:`, result.error);
        }
      }

      return { 
        success: allSuccess, 
        totalReleased,
        results,
        error: allSuccess ? null : "Some items failed to release. Check console for details."
      };
    } catch (error: any) {
      console.error("Error releasing all stock from quotation:", error);
      return { 
        success: false, 
        error: `System error: ${error.message}` 
      };
    }
  }

  public async getAvailableStock(itemId: number, warehouseId: number = 1) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .select("quantity, reserved")
        .eq("item", itemId)
        .eq("warehouse", warehouseId)
        .limit(1);

      if (error) {
        return { 
          success: false, 
          error: `Database error: ${error.message}` 
        };
      }

      if (!data || data.length === 0) {
        return { 
          success: true, 
          totalAvailable: 0, 
          quantity: 0, 
          reserved: 0,
          itemId,
          warehouseId
        };
      }

      const stock = data[0];
      const quantity = parseFloat(stock.quantity) || 0;
      const reserved = parseFloat(stock.reserved) || 0;
      const totalAvailable = Math.max(0, quantity - reserved);
      
      return { 
        success: true, 
        totalAvailable,
        quantity,
        reserved,
        itemId,
        warehouseId,
        data: stock
      };
    } catch (error: any) {
      console.error("Error checking available stock:", error);
      return { 
        success: false, 
        error: `System error: ${error.message}` 
      };
    }
  }

  public async adjustStockReservation(
    quotationId: number,
    itemId: number,
    warehouseId: number,
    oldQuantity: number,
    newQuantity: number
  ) {
    try {
      const quantityDiff = newQuantity - oldQuantity;
      
      if (quantityDiff === 0) {
        return { 
          success: true, 
          adjusted: 0,
          message: "No quantity change" 
        };
      }
      
      if (quantityDiff > 0) {
        // Need to reserve more stock
        const result = await this.reserveForQuotation(
          itemId,
          warehouseId,
          quantityDiff,
          quotationId
        );
        
        return {
          ...result,
          adjusted: quantityDiff,
          action: "reserved"
        };
      } else {
        // Need to release stock
        const result = await this.releaseFromQuotation(
          quotationId,
          itemId,
          warehouseId,
          Math.abs(quantityDiff)
        );
        
        return {
          ...result,
          adjusted: Math.abs(quantityDiff),
          action: "released"
        };
      }
    } catch (error: any) {
      console.error("Error adjusting stock reservation:", error);
      return { 
        success: false, 
        error: `System error: ${error.message}`,
        adjusted: 0
      };
    }
  }

  public async getTotalStock(itemId: number, warehouseId: number = 1) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .select("quantity, reserved")
        .eq("item", itemId)
        .eq("warehouse", warehouseId)
        .limit(1);

      if (error) {
        return { 
          success: false, 
          error: `Database error: ${error.message}` 
        };
      }

      if (!data || data.length === 0) {
        return { 
          success: true, 
          totalStock: 0, 
          quantity: 0, 
          reserved: 0 
        };
      }

      const stock = data[0];
      const quantity = parseFloat(stock.quantity) || 0;
      const reserved = parseFloat(stock.reserved) || 0;
      
      return { 
        success: true, 
        totalStock: quantity,
        quantity,
        reserved,
        available: quantity - reserved
      };
    } catch (error: any) {
      console.error("Error checking total stock:", error);
      return { 
        success: false, 
        error: `System error: ${error.message}` 
      };
    }
  }

  public async canReserveStock(
    itemId: number,
    warehouseId: number,
    quantity: number
  ) {
    try {
      const result = await this.getAvailableStock(itemId, warehouseId);
      if (!result.success) {
        return { 
          ...result, 
          canReserve: false 
        };
      }

      return {
        ...result,
        canReserve: result.totalAvailable || 1 >= quantity,
        requested: quantity,
        sufficient: result.totalAvailable || 1 >= quantity // TODO:
      };
    } catch (error: any) {
      console.error("Error checking if can reserve stock:", error);
      return { 
        success: false, 
        error: `System error: ${error.message}`, 
        canReserve: false 
      };
    }
  }

  public async getByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .select(`
          *,
          items (id, name, itemCode),
          warehouses (id, name)
        `)
        .eq("status", status)
        .order("updated_at", { ascending: false });

      return { data, error };
    } catch (error) {
      console.error("Error fetching stock by status:", error);
      return { data: null, error };
    }
  }
}

export default StocksRepository;