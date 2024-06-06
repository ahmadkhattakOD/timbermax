import supabase from "utils/supabase";

export interface WarehouseSupabase {
  name: string;
  address: string;
  state: string;
  post_code: string;
}

class WarehousesRepository {
  private className = "warehouses";

  public async create(warehouse: WarehouseSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(warehouse)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new warehouse:", error);
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
        data: warehousesData,
        count: warehousesCount,
        error: warehousesError,
      } = await supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      return { warehousesData, warehousesCount, warehousesError };
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: warehousesData, error: warehousesError } = await supabase
        .from(this.className)
        .select("*")
        .order('created_at', { ascending: false })

      return { warehousesData, warehousesError };
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: warehouseData, error: warehouseError } = await supabase
        .from(this.className)
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { warehouseData, warehouseError };
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      return null;
    }
  }

  public async edit(id: number, warehouse: WarehouseSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(warehouse)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing warehouse:", error);
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
      console.error("Error deleting warehouses:", error);
      return 0;
    }
  }
}
export default WarehousesRepository;
