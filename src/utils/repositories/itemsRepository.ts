import { ValuesFilterItems } from "pages/items/main/useItems";
import supabase from "utils/supabase";

export interface ItemSupabase {
  name: string;
  description: string;
  itemCode: string;
  sellPrice: number;
  purchasePrice: number;
  gst:boolean
}

class ItemsRepository {
  private className = "items";

  public async create(item: ItemSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(item)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new item:", error);
      return null;
    }
  }

  public async get(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterItems
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      if (filters) {
        if (filters.name) {
          query.ilike("name", `%${filters.name}%`);
        }
        if (filters.description) {
          query.ilike("description", `%${filters.description}%`);
        }
        if (filters.itemCode) {
          query.ilike("itemCode", `%${filters.itemCode}%`);
        }
      }

      const {
        data: itemsData,
        count: itemsCount,
        error: itemsError,
      } = await query;

      return { itemsData, itemsCount, itemsError };
    } catch (error) {
      console.error("Error fetching items:", error);
      return null;
    }
  }

  public async getByName(searchTerm: string = "", limit: number = 10) {
    try {
      let query = supabase
        .from(this.className)
        .select("*")
        .order("name", { ascending: true })
        .limit(limit);
        
        if (searchTerm.trim()) {
          // Search in both name and itemCode fields
          query = query.or(`name.ilike.%${searchTerm}%,itemCode.ilike.%${searchTerm}%`);
        }
        
        const { data: itemsData, error: itemsError } = await query;

      return { itemsData, itemsError };
    } catch (error) {
      console.error("Error searching items:", error);
      return { itemsData: [], itemsError: error };
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from(this.className)
        .select("*")
        .order("created_at", { ascending: false });

      return { itemsData, itemsError };
    } catch (error) {
      console.error("Error fetching items:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: itemData, error: itemError } = await supabase
        .from(this.className)
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { itemData, itemError };
    } catch (error) {
      console.error("Error fetching item:", error);
      return null;
    }
  }

  public async edit(id: number, item: ItemSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(item)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing item:", error);
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
      console.error("Error deleting items:", error);
      return 0;
    }
  }
}

export default ItemsRepository;