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
              reserved:
                (stock.reserved || 0) +
                (parseFloat(existingStock.reserved) || 0),
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
        const available =
          parseFloat(existingStock.quantity) -
          (parseFloat(existingStock.reserved) || 0);

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
      // 1. Check available stock
      const { data: stockData, error: stockError } = await supabase
        .from(this.className)
        .select("id, quantity, reserved")
        .eq("item", itemId)
        .eq("warehouse", warehouseId)
        .limit(1);

      if (stockError || !stockData || stockData.length === 0) {
        return { success: false, error: "Stock not found" };
      }

      const stock = stockData[0];
      const currentQuantity = parseFloat(stock.quantity) || 0;
      const currentReserved = parseFloat(stock.reserved) || 0;
      const available = currentQuantity - currentReserved;

      // 2. Validate available stock
      if (available < quantity) {
        return {
          success: false,
          error: `Insufficient stock. Available: ${available}, Requested: ${quantity}`,
          available,
          requested: quantity,
        };
      }

      // 3. Create reservation record
      const { data: reservation, error: reservationError } = await supabase
        .from("stock_reservations")
        .insert({
          item_id: itemId,
          warehouse_id: warehouseId,
          quotation_id: quotationId,
          quantity: quantity,
          status: "on_hold",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (reservationError) {
        return {
          success: false,
          error: `Failed to create reservation: ${reservationError.message}`,
        };
      }

      // 4. Update stock reserved quantity
      const newReserved = currentReserved + quantity;
      const { error: updateError } = await supabase
        .from(this.className)
        .update({
          reserved: newReserved,
          status: "on_hold",
          updated_at: new Date().toISOString(),
        })
        .eq("id", stock.id);

      if (updateError) {
        // Rollback reservation if stock update fails
        await supabase
          .from("stock_reservations")
          .delete()
          .eq("id", reservation.id);
        return {
          success: false,
          error: `Failed to update stock: ${updateError.message}`,
        };
      }

      return {
        success: true,
        reservationId: reservation.id,
        reservedQuantity: quantity,
        totalReserved: newReserved,
        available: currentQuantity - newReserved,
      };
    } catch (error: any) {
      console.error("Error reserving stock:", error);
      return { success: false, error: `System error: ${error.message}` };
    }
  }

// Add these methods to StocksRepository class

// Method to release ALL stock from a quotation (for cancellation)
public async releaseAllFromQuotation(quotationId: number) {
  try {
    // 1. Get all reservations for this quotation
    const { data: reservations, error: resError } = await supabase
      .from("stock_reservations")
      .select("id, item_id, warehouse_id, quantity")
      .eq("quotation_id", quotationId)
      .eq("status", "on_hold");

    if (resError) {
      return {
        success: false,
        error: `Failed to fetch reservations: ${resError.message}`,
      };
    }

    if (!reservations || reservations.length === 0) {
      return {
        success: true,
        released: 0,
        message: "No active reservations found",
      };
    }

    let totalReleased = 0;
    const releaseResults = [];

    // 2. Release each reservation
    for (const reservation of reservations) {
      // Update reservation status
      const { error: updateResError } = await supabase
        .from("stock_reservations")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservation.id);

      if (updateResError) {
        console.error(
          `Failed to release reservation ${reservation.id}:`,
          updateResError
        );
        continue;
      }

      // Update stock reserved quantity
      const { data: stockData } = await supabase
        .from(this.className)
        .select("id, quantity, reserved")
        .eq("item", reservation.item_id)
        .eq("warehouse", reservation.warehouse_id)
        .single();

      if (stockData) {
        const currentReserved = parseFloat(stockData.reserved) || 0;
        const newReserved = Math.max(
          0,
          currentReserved - reservation.quantity
        );
        const newStatus = newReserved === 0 ? "available" : "on_hold";

        await supabase
          .from(this.className)
          .update({
            reserved: newReserved,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", stockData.id);

        totalReleased += reservation.quantity;
        releaseResults.push({
          itemId: reservation.item_id,
          released: reservation.quantity,
          success: true,
        });
      }
    }

    return {
      success: true,
      totalReleased,
      results: releaseResults,
    };
  } catch (error: any) {
    console.error("Error releasing stock:", error);
    return { success: false, error: `System error: ${error.message}` };
  }
}

// Method to release specific quantity of an item from a quotation (for editing)
public async releaseFromQuotation(
  quotationId: number,
  itemId: number,
  warehouseId: number,
  quantity: number
) {
  try {
    // 1. Get active reservations for this item and quotation
    const { data: reservations, error: resError } = await supabase
      .from("stock_reservations")
      .select("id, quantity")
      .eq("quotation_id", quotationId)
      .eq("item_id", itemId)
      .eq("warehouse_id", warehouseId)
      .eq("status", "on_hold")
      .order("created_at", { ascending: true }); // Release oldest first

    if (resError) {
      return {
        success: false,
        error: `Failed to fetch reservations: ${resError.message}`,
      };
    }

    if (!reservations || reservations.length === 0) {
      return {
        success: false,
        error: "No active reservations found for this item",
        released: 0,
      };
    }

    let remainingToRelease = quantity;
    let totalReleased = 0;
    const releaseResults = [];

    // 2. Release from reservations (oldest first)
    for (const reservation of reservations) {
      if (remainingToRelease <= 0) break;

      const reservationQuantity = parseFloat(reservation.quantity);
      const releaseQuantity = Math.min(remainingToRelease, reservationQuantity);

      if (releaseQuantity === reservationQuantity) {
        // Release entire reservation
        const { error: updateResError } = await supabase
          .from("stock_reservations")
          .update({
            status: "released",
            released_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", reservation.id);

        if (updateResError) {
          console.error(
            `Failed to release reservation ${reservation.id}:`,
            updateResError
          );
          continue;
        }
      } else {
        // Partially release reservation - create new reservation for remaining quantity
        const { error: updateResError } = await supabase
          .from("stock_reservations")
          .update({
            quantity: reservationQuantity - releaseQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", reservation.id);

        if (updateResError) {
          console.error(
            `Failed to partially release reservation ${reservation.id}:`,
            updateResError
          );
          continue;
        }

        // Create new reservation for the released portion
        await supabase
          .from("stock_reservations")
          .insert({
            item_id: itemId,
            warehouse_id: warehouseId,
            quotation_id: quotationId,
            quantity: releaseQuantity,
            status: "released",
            released_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      // Update stock reserved quantity
      const { data: stockData } = await supabase
        .from(this.className)
        .select("id, quantity, reserved")
        .eq("item", itemId)
        .eq("warehouse", warehouseId)
        .single();

      if (stockData) {
        const currentReserved = parseFloat(stockData.reserved) || 0;
        const newReserved = Math.max(0, currentReserved - releaseQuantity);
        const newStatus = newReserved === 0 ? "available" : "on_hold";

        await supabase
          .from(this.className)
          .update({
            reserved: newReserved,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", stockData.id);
      }

      remainingToRelease -= releaseQuantity;
      totalReleased += releaseQuantity;
      releaseResults.push({
        reservationId: reservation.id,
        released: releaseQuantity,
        success: true,
      });
    }

    if (remainingToRelease > 0) {
      return {
        success: false,
        error: `Could not release ${quantity} items. Only released ${totalReleased}. Insufficient reserved stock.`,
        released: totalReleased,
        needed: remainingToRelease,
      };
    }

    return {
      success: true,
      released: totalReleased,
      results: releaseResults,
    };
  } catch (error: any) {
    console.error("Error releasing stock from quotation:", error);
    return {
      success: false,
      error: `System error: ${error.message}`,
      released: 0,
    };
  }
}

// Method to get reservations for a specific item and quotation
public async getItemReservationsForQuotation(
  quotationId: number,
  itemId: number,
  warehouseId: number = 1
) {
  try {
    const { data, error } = await supabase
      .from("stock_reservations")
      .select("id, quantity, status, created_at")
      .eq("quotation_id", quotationId)
      .eq("item_id", itemId)
      .eq("warehouse_id", warehouseId)
      .eq("status", "on_hold")
      .order("created_at", { ascending: true });

    return { data, error };
  } catch (error) {
    console.error("Error fetching item reservations:", error);
    return { data: null, error };
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
          error: `Database error: ${error.message}`,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          totalAvailable: 0,
          quantity: 0,
          reserved: 0,
          itemId,
          warehouseId,
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
        data: stock,
      };
    } catch (error: any) {
      console.error("Error checking available stock:", error);
      return {
        success: false,
        error: `System error: ${error.message}`,
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
          message: "No quantity change",
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
          action: "reserved",
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
          action: "released",
        };
      }
    } catch (error: any) {
      console.error("Error adjusting stock reservation:", error);
      return {
        success: false,
        error: `System error: ${error.message}`,
        adjusted: 0,
      };
    }
  }
  public async getReservationsByQuotation(quotationId: number) {
    try {
      const { data, error } = await supabase
        .from("stock_reservations")
        .select(
          `
        *,
        items:item_id (id, name, itemCode),
        warehouses:warehouse_id (id, name)
      `
        )
        .eq("quotation_id", quotationId)
        .order("created_at", { ascending: false });

      return { data, error };
    } catch (error) {
      console.error("Error fetching reservations:", error);
      return { data: null, error };
    }
  }

  public async getReservedStockByItem(itemId: number, warehouseId: number = 1) {
    try {
      const { data, error } = await supabase
        .from("stock_reservations")
        .select(
          `
  *,
  quotations:quotation_id (
    id,
    quotation_number,
    status,
    customer_id,
    customers:customer_id (
      id,
      name
    )
  )
`
        )
        .eq("item_id", itemId)
        .eq("warehouse_id", warehouseId)
        .eq("status", "on_hold")
        .order("created_at", { ascending: false });

      return { data, error };
    } catch (error) {
      console.error("Error fetching reserved stock:", error);
      return { data: null, error };
    }
  }

  public async getTotalReservedForItem(
    itemId: number,
    warehouseId: number = 1
  ) {
    try {
      console.log("COMINGGG");
      const { data, error } = await supabase
        .from("stock_reservations")
        .select("quantity")
        .eq("item_id", itemId)
        .eq("warehouse_id", warehouseId)
        .eq("status", "on_hold");
      console.log("DATA", data);
      if (error) return { success: false, error: error.message };

      const totalReserved =
        data?.reduce((sum, item) => sum + parseFloat(item.quantity), 0) || 0;

      return {
        success: true,
        totalReserved,
        reservations: data,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
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
          error: `Database error: ${error.message}`,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          totalStock: 0,
          quantity: 0,
          reserved: 0,
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
        available: quantity - reserved,
      };
    } catch (error: any) {
      console.error("Error checking total stock:", error);
      return {
        success: false,
        error: `System error: ${error.message}`,
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
          canReserve: false,
        };
      }

      return {
        ...result,
        canReserve: result.totalAvailable || 1 >= quantity,
        requested: quantity,
        sufficient: result.totalAvailable || 1 >= quantity, // TODO:
      };
    } catch (error: any) {
      console.error("Error checking if can reserve stock:", error);
      return {
        success: false,
        error: `System error: ${error.message}`,
        canReserve: false,
      };
    }
  }

  public async getByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .select(
          `
          *,
          items (id, name, itemCode),
          warehouses (id, name)
        `
        )
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
