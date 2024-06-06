import supabase from "utils/supabase";

export interface ItemSupabase {
  name: string;
  description: string;
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
    limit: number
  ) {
    try {
      const {
        data: itemsData,
        count: itemsCount,
        error: itemsError,
      } = await supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      return { itemsData, itemsCount, itemsError };
    } catch (error) {
      console.error("Error fetching items:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from(this.className)
        .select("*")
        .order('created_at', { ascending: false })

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
      console.error("Error deleting items:", error);
      return 0;
    }
  }
}
export default ItemsRepository;
