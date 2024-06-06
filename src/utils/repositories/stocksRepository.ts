import supabase from "utils/supabase";

export interface StockSupabase {
  item: number;
  warehouse: number;
  quantity: number;
  updated_at: Date;
}

class StocksRepository {
  private className = "stocks";

  public async create(stock: StockSupabase) {
    try {
      const { data: existingStockData, error: existingStockError } =
        await supabase
          .from(this.className)
          .select("id, quantity")
          .eq("item", stock.item)
          .eq("warehouse", stock.warehouse);

      if (
        existingStockData &&
        existingStockData.length > 0 &&
        !existingStockError
      ) {
        const { data, error } = await supabase
          .from(this.className)
          .update({
            item: stock.item,
            warehouse: stock.warehouse,
            quantity: stock.quantity + existingStockData[0].quantity,
            updated_at: stock.updated_at,
          })
          .eq("id", existingStockData[0].id)
          .select();

        if (data && data.length > 0 && error === null) {
          return data[0];
        }
        return null;
      } else {
        const { data, error } = await supabase
          .from(this.className)
          .insert(stock)
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
    limit: number
  ) {
    try {
      const {
        data: stocksData,
        count: stocksCount,
        error: stocksError,
      } = await supabase
        .from(this.className)
        .select(
          "id, item (id, name), warehouse (id, name), quantity, updated_at",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      return { stocksData, stocksCount, stocksError };
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
          "id, item (id, name), warehouse (id, name), quantity, updated_at"
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
            .select("id, quantity")
            .eq("item", stock.item)
            .eq("warehouse", stock.warehouse);

        if (
          existingStockData &&
          existingStockData.length > 0 &&
          !existingStockError
        ) {
          const { data, error } = await supabase
            .from(this.className)
            .update({
              item: stock.item,
              warehouse: stock.warehouse,
              quantity: stock.quantity + existingStockData[0].quantity,
              updated_at: stock.updated_at,
            })
            .eq("id", existingStockData[0].id)
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
          .update(stock)
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

  public async delete(ids: readonly number[]) {
    try {
      let deletedIdsCount = 0;
      for (let i = 0; i < ids.length; i++) {
        const { data, error } = await supabase
          .from(this.className)
          .delete()
          .eq("id", ids[i])
          .select();

        if (data && data.length > 0 && error === null) {
          deletedIdsCount += 1;
        }
      }

      return deletedIdsCount;
    } catch (error) {
      console.error("Error deleting stocks:", error);
      return 0;
    }
  }
}

export default StocksRepository;
