import supabase from "utils/supabase";

export interface VendorSupabase {
  name: string;
}

class VendorsRepository {
  private className = "vendors";

  public async create(vendor: VendorSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(vendor)
        .select('*');

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new vendor:", error);
      return null;
    }
  }

  public async get(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    search?: string
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      if (search) {
        query.ilike("name", `%${search}%`);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error("Error fetching vendors:", error);
        return null;
      }

      return { vendorsData: data, vendorsCount: count };
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: vendorsData, error: vendorsError } = await supabase
        .from(this.className)
        .select("*")
        .order("name", { ascending: true });

      return { vendorsData, vendorsError };
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from(this.className)
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { vendorData, vendorError };
    } catch (error) {
      console.error("Error fetching vendor:", error);
      return null;
    }
  }

  public async edit(id: number, vendor: VendorSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(vendor)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing vendor:", error);
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
      console.error("Error deleting vendors:", error);
      return 0;
    }
  }
}

export default VendorsRepository;
