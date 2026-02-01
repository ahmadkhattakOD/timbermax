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
  updated_at?: any;
}

export interface ReserveStockParams {
  itemId: number;
  warehouseId: number;
  quantity: number;
  referenceId: number;
  referenceType: "quotation" | "invoice";
}

export interface StockMovement {
  id?: number;
  stock_id?: number | null;
  item_id: number;
  warehouse_id: number;
  user_id: string;
  movement_type: "in" | "out" | "adjustment" | "reserve" | "release";
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  notes?: string;
  created_at?: string;
}

class StocksRepository {
  private className = "stocks";

  /**
   * Get current user ID from Supabase auth
   */
  private async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || "system";
  }

  /**
   * Record a stock movement for audit trail
   */
  private async recordMovement(
    stockId: number | null,
    itemId: number,
    warehouseId: number,
    userId: string,
    movementType: "in" | "out" | "adjustment" | "reserve" | "release",
    quantityChange: number,
    quantityBefore: number,
    quantityAfter: number,
    notes?: string,
  ): Promise<void> {
    try {
      await supabase.from("stock_movements").insert({
        stock_id: stockId,
        item_id: itemId,
        warehouse_id: warehouseId,
        user_id: userId,
        movement_type: movementType,
        quantity_change: quantityChange,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        notes: notes,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error recording stock movement:", error);
      // Don't throw - movement tracking shouldn't break stock operations
    }
  }

  /**
   * Get movement history for a stock item
   */
  public async getMovementHistory(
    itemId: number,
    warehouseId?: number,
    limit: number = 50,
  ) {
    try {
      let query = supabase
        .from("stock_movements")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (warehouseId) {
        query = query.eq("warehouse_id", warehouseId);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error("Error fetching movement history:", error);
      return { data: null, error };
    }
  }

  public async create(stock: StockSupabase, notes?: string) {
    try {
      // Get current user ID
      const userId = await this.getCurrentUserId();

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
        // UPDATE existing stock
        const existingStock = existingStockData[0];
        const quantityBefore = parseFloat(existingStock.quantity);
        const quantityAfter = stock.quantity + quantityBefore;

        const { data, error } = await supabase
          .from(this.className)
          .update({
            item: stock.item,
            warehouse: stock.warehouse,
            quantity: quantityAfter,
            reserved: stock.reserved || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingStock.id)
          .select();
        if (data && data.length > 0 && error === null) {
          // 📝 Record movement
          await this.recordMovement(
            existingStock.id,
            stock.item,
            stock.warehouse,
            userId,
            "in",
            stock.quantity, // Quantity added
            quantityBefore,
            quantityAfter,
            notes || "",
          );

          return data[0];
        }
        return null;
      } else {
        // CREATE new stock
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
          // 📝 Record movement
          await this.recordMovement(
            data[0].id,
            stock.item,
            stock.warehouse,
            userId,
            "in",
            stock.quantity, // Initial quantity
            0, // Was 0 before
            stock.quantity,
            notes,
          );

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
    filters?: ValuesFilterStock,
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          `
    id,
    item!inner (id, name, itemCode),
    warehouse!inner (id, name),
    quantity,
    reserved,
    status,
    reference_id,
    reference_type,
    updated_at
    `,
          { count: "exact" },
        )
        .order(orderBy, { ascending })
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
      console.log("STOCKS ", stocksData);
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

  public async transferReservedStockToInvoice(
    quotationId: number,
    invoiceId: number,
  ) {
    try {
      // Get current user ID
      const userId = await this.getCurrentUserId();

      // 1. Get all reservations for this quotation
      const { data: reservations, error } = await supabase
        .from("stock_reservations")
        .select("id, item_id, warehouse_id, quantity")
        .eq("quotation_id", quotationId)
        .eq("status", "on_hold");

      if (error) {
        return {
          success: false,
          error: `Failed to get reservations: ${error.message}`,
        };
      }

      if (!reservations || reservations.length === 0) {
        return {
          success: true,
          message: "No reservations to transfer",
          transferred: 0,
        };
      }

      let totalTransferred = 0;

      // 2. Process each reservation
      for (const reservation of reservations) {
        // Release from reservation
        const releaseResult = await this.releaseFromQuotation(
          quotationId,
          reservation.item_id,
          reservation.warehouse_id,
          reservation.quantity,
        );

        if (!releaseResult.success) {
          console.warn(
            `Failed to release reservation ${reservation.id}:`,
            releaseResult.error,
          );
          continue;
        }

        // Reduce stock (actual deduction)
        const reduceResult = await this.reduceStockForInvoice(
          reservation.item_id,
          reservation.warehouse_id,
          reservation.quantity,
          invoiceId,
          userId,
        );

        if (!reduceResult.success) {
          console.warn(
            `Failed to reduce stock for item ${reservation.item_id}:`,
            reduceResult.error,
          );
          continue;
        }

        totalTransferred += reservation.quantity;
      }

      return {
        success: true,
        transferred: totalTransferred,
        reservationsProcessed: reservations.length,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  // In stocksRepository.ts - Add these methods

  /**
   * Get last movement for a stock item
   */
  public async getLastMovement(stockId: number) {
    try {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          `
        *,
        user:user_id (
          id,full_name,email
        )
      `,
        )
        .eq("stock_id", stockId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return { data, error };
    } catch (error) {
      console.error("Error fetching last movement:", error);
      return { data: null, error };
    }
  }

  /**
   * Get movement history for a stock item with user info
   */
  public async getMovementHistoryWithUsers(
    itemId: number,
    warehouseId?: number,
    limit: number = 50,
  ) {
    try {
      let query = supabase
        .from("stock_movements")
        .select(
          `
        *,
        user:user_id (
          id,
          email,
          full_name
        ),
        stock:stock_id (
          item:item (name, itemCode),
          warehouse:warehouse (name)
        )
      `,
        )
        .eq("item_id", itemId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (warehouseId) {
        query = query.eq("warehouse_id", warehouseId);
      }

      const { data, error } = await query;
      console.log("logs ", data);

      return { data, error };
    } catch (error) {
      console.error("Error fetching movement history:", error);
      return { data: null, error };
    }
  }

  /**
   * Get stock data with last user info
   */
  public async getStockWithLastUser(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterStock,
  ) {
    try {
      console.log("Cominggg");

      const query = supabase
        .from(this.className) // "stocks"
        .select(
          `
    id,
    item!inner (id, name, itemCode),
    warehouse!inner (id, name),
    quantity,
    reserved,
    status,
    reference_id,
    reference_type,
    updated_at,
    stock_movements (
      *,
      user:user_id(full_name,email)
    )
    `,
          { count: "exact" },
        )
        .order(orderBy, { ascending })
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

      // Process data to get last movement info
      const processedData =
        stocksData?.map((stock) => {
          const movements = stock.stock_movements || [];
          const lastMovement =
            movements.length > 0
              ? movements.reduce((latest: any, current: any) => {
                  return new Date(current.created_at) >
                    new Date(latest.created_at)
                    ? current
                    : latest;
                }, movements[0])
              : null;

          return {
            ...stock,
            last_movement: lastMovement,
            last_updated_by:
              lastMovement?.user?.email ||
              lastMovement?.user?.full_name ||
              "System",
            last_updated_at: lastMovement?.created_at || stock.updated_at,
          };
        }) || [];

      console.log("STOCKS WITH HISTORY ", processedData);
      return { stocksData: processedData, stocksCount, stocksError };
    } catch (error) {
      console.error("Error fetching stocks with history:", error);
      return null;
    }
  }
  public async getSingle(id: number) {
    try {
      const { data: stockData, error: stockError } = await supabase
        .from(this.className)
        .select(
          "id, item (id, name), warehouse (id, name), quantity, reserved, status, reference_id, reference_type, updated_at",
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
          "id, item (id, name), warehouse (id, name), quantity, reserved, status, updated_at",
        )
        .eq("warehouse", warehouse);

      return { stocksData, stocksError };
    } catch (error) {
      console.error("Error fetching stock:", error);
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
    quotationId: number,
  ) {
    try {
      // Get current user ID
      const userId = await this.getCurrentUserId();

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

      // 📝 Record movement
      await this.recordMovement(
        stock.id,
        itemId,
        warehouseId,
        userId,
        "reserve",
        0, // No quantity change, just reserved
        currentQuantity,
        currentQuantity,
        `Stock reserved for quotation #${quotationId}`,
      );

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

  // Method to release ALL stock from a quotation (for cancellation)
  public async releaseAllFromQuotation(quotationId: number) {
    try {
      // Get current user ID
      const userId = await this.getCurrentUserId();

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
            updateResError,
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
          const currentQuantity = parseFloat(stockData.quantity) || 0;
          const currentReserved = parseFloat(stockData.reserved) || 0;
          const newReserved = Math.max(
            0,
            currentReserved - reservation.quantity,
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

          // 📝 Record movement
          await this.recordMovement(
            stockData.id,
            reservation.item_id,
            reservation.warehouse_id,
            userId,
            "release",
            0, // No quantity change, just unreserved
            currentQuantity,
            currentQuantity,
            `Stock released from quotation #${quotationId}`,
          );

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
    quantity: number,
  ) {
    try {
      // Get current user ID
      const userId = await this.getCurrentUserId();

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
        const releaseQuantity = Math.min(
          remainingToRelease,
          reservationQuantity,
        );

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
              updateResError,
            );
            continue;
          }
        } else {
          // Partially release reservation
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
              updateResError,
            );
            continue;
          }

          // Create new reservation for the released portion
          await supabase.from("stock_reservations").insert({
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
          const currentQuantity = parseFloat(stockData.quantity) || 0;
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

          // 📝 Record movement (only once per stock update, not per reservation)
          if (remainingToRelease === quantity) {
            // First iteration
            await this.recordMovement(
              stockData.id,
              itemId,
              warehouseId,
              userId,
              "release",
              0,
              currentQuantity,
              currentQuantity,
              `Stock released from quotation #${quotationId} (${quantity} units)`,
            );
          }
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
    warehouseId: number = 1,
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
    newQuantity: number,
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
          quotationId,
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
          Math.abs(quantityDiff),
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
      `,
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
`,
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
    warehouseId: number = 1,
  ) {
    try {
      const { data, error } = await supabase
        .from("stock_reservations")
        .select("quantity")
        .eq("item_id", itemId)
        .eq("warehouse_id", warehouseId)
        .eq("status", "on_hold");

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
    quantity: number,
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
        canReserve: (result.totalAvailable ?? 0) >= quantity,
        requested: quantity,
        sufficient: (result.totalAvailable ?? 0) >= quantity,
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
        `,
        )
        .eq("status", status)
        .order("updated_at", { ascending: false });

      return { data, error };
    } catch (error) {
      console.error("Error fetching stock by status:", error);
      return { data: null, error };
    }
  }

  /**
   * Direct stock reduction for invoices (no reservation, allows negative)
   */
  public async reduceStockForInvoice(
    itemId: number,
    warehouseId: number,
    quantity: number,
    invoiceId: number,
    userId?: string, // Make optional
  ) {
    try {
      // Get current user ID if not provided
      const currentUserId = userId || (await this.getCurrentUserId());

      const { data: stockData, error: stockError } = await supabase
        .from(this.className)
        .select("id, quantity, reserved, warehouse")
        .eq("item", itemId)
        .eq("warehouse", warehouseId) // Use provided warehouseId
        .limit(1);

      if (stockError) {
        return {
          success: false,
          error: `Database error: ${stockError.message}`,
        };
      }

      if (!stockData || stockData.length === 0) {
        return {
          success: false,
          error: `Stock record not found for item ${itemId} in warehouse ${warehouseId}`,
        };
      }

      const currentQuantity = parseFloat(stockData[0].quantity) || 0;
      const newQuantity = currentQuantity - quantity;

      const { error: updateError } = await supabase
        .from(this.className)
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stockData[0].id);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update stock: ${updateError.message}`,
        };
      }

      // 📝 Record movement with POSITIVE quantity
      await this.recordMovement(
        stockData[0].id,
        itemId,
        warehouseId,
        currentUserId,
        "out",
        quantity, // Positive quantity
        currentQuantity,
        newQuantity,
        `Stock reduced for invoice #${invoiceId}`,
      );

      return {
        success: true,
        previousQuantity: currentQuantity,
        newQuantity: newQuantity,
        reduction: quantity,
        itemId,
        warehouseId,
      };
    } catch (error: any) {
      console.error("Error reducing stock for invoice:", error);
      return {
        success: false,
        error: `System error: ${error.message}`,
      };
    }
  }

  /**
   * Restore stock when invoice is cancelled
   */
  public async restoreStockFromInvoice(
    itemId: number,
    warehouseId: number,
    quantity: number,
  ) {
    try {
      // Get current user ID
      const userId = await this.getCurrentUserId();

      let query = supabase
        .from(this.className)
        .select("id, quantity, warehouse");

      if (warehouseId && warehouseId !== 1) {
        query = query.eq("item", itemId).eq("warehouse", warehouseId);
      } else {
        query = query.eq("item", itemId);
      }

      const { data: stockData } = await query.limit(1);

      const currentQuantity = stockData?.[0]?.quantity
        ? parseFloat(stockData[0].quantity)
        : 0;
      const newQuantity = currentQuantity + quantity;

      if (stockData && stockData.length > 0) {
        const { error } = await supabase
          .from(this.className)
          .update({
            quantity: newQuantity,
            status: newQuantity > 0 ? "available" : "out_of_stock",
            updated_at: new Date().toISOString(),
          })
          .eq("id", stockData[0].id);

        if (error) throw error;

        // 📝 Record movement
        await this.recordMovement(
          stockData[0].id,
          itemId,
          warehouseId,
          userId,
          "in",
          quantity, // Positive for restoration
          currentQuantity,
          newQuantity,
          `Stock restored from cancelled invoice`,
        );
      } else {
        const { data, error } = await supabase
          .from(this.className)
          .insert({
            item: itemId,
            warehouse: warehouseId || 1,
            quantity: newQuantity,
            reserved: 0,
            status: newQuantity > 0 ? "available" : "out_of_stock",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          // 📝 Record movement
          await this.recordMovement(
            data[0].id,
            itemId,
            warehouseId,
            userId,
            "in",
            quantity,
            currentQuantity,
            newQuantity,
            `Stock restored from cancelled invoice`,
          );
        }
      }

      return { success: true, newQuantity, itemId };
    } catch (error: any) {
      console.error("Error restoring stock from invoice:", error);
      return { success: false, error: error.message };
    }
  }

  public async getCurrentStock(itemId: number, warehouseId: number = 1) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .select("quantity, reserved")
        .eq("item", itemId)
        .eq("warehouse", warehouseId)
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: true, quantity: 0, reserved: 0, available: 0 };
      }

      const stock = data[0];
      const quantity = parseFloat(stock.quantity) || 0;
      const reserved = parseFloat(stock.reserved) || 0;

      return {
        success: true,
        quantity: quantity,
        reserved: reserved,
        available: quantity - reserved,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  public async releaseReservationsFromQuotation(quotationId: number) {
    try {
      const { data: quotationItems, error: itemError } = await supabase
        .from("quotation_items")
        .select("item_id, quantity")
        .eq("quotation_id", quotationId);

      if (itemError) {
        return {
          success: false,
          error: `Failed to fetch quotation items: ${itemError.message}`,
        };
      }

      if (!quotationItems || quotationItems.length === 0) {
        return {
          success: true,
          released: 0,
          results: [],
        };
      }

      const releaseResults = [];

      for (const item of quotationItems) {
        const itemId = item.item_id;
        const reservedQuantity = item.quantity;

        try {
          const { data: stockData, error: stockError } = await supabase
            .from(this.className)
            .select("id, quantity, reserved")
            .eq("item", itemId)
            .limit(1);

          if (stockError || !stockData || stockData.length === 0) {
            releaseResults.push({
              itemId,
              success: false,
              error: "Stock record not found",
            });
            continue;
          }

          const stock = stockData[0];
          const currentReserved = parseFloat(stock.reserved) || 0;
          const newReserved = Math.max(0, currentReserved - reservedQuantity);

          const { error: updateError } = await supabase
            .from(this.className)
            .update({
              reserved: newReserved,
              updated_at: new Date().toISOString(),
            })
            .eq("id", stock.id);

          if (updateError) {
            releaseResults.push({
              itemId,
              success: false,
              error: `Failed to update stock: ${updateError.message}`,
            });
          } else {
            releaseResults.push({
              itemId,
              success: true,
              releasedQuantity: reservedQuantity,
              previousReserved: currentReserved,
              newReserved: newReserved,
            });
          }
        } catch (error: any) {
          releaseResults.push({
            itemId,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        released: quotationItems.length,
        results: releaseResults,
      };
    } catch (error: any) {
      console.error("Error releasing reservations:", error);
      return { success: false, error: error.message };
    }
  }
}

export default StocksRepository;
