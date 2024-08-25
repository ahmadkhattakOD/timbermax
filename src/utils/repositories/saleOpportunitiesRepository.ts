import supabase from "utils/supabase";

export interface SaleOpportunitySupabase {
  opportunity: number;
  sale: number;
}

class SaleOpportunitiesRepository {
  private className = "sale_opportunities";

  public async create(saleOpportunity: SaleOpportunitySupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(saleOpportunity)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new sale opportunity:", error);
      return null;
    }
  }

  public async get(id: number) {
    try {
      const { data: saleOpportunitiesData, error: saleOpportunitiesError } =
        await supabase
          .from(this.className)
          .select("*")
          .order("created_at", { ascending: true })
          .eq("opportunity", id);

      return { saleOpportunitiesData, saleOpportunitiesError };
    } catch (error) {
      console.error("Error fetching sale opportunities:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: saleOpportunityData, error: saleOpportunityError } =
        await supabase
          .from(this.className)
          .select("*")
          .eq("id", id)
          .limit(1)
          .maybeSingle();

      return { saleOpportunityData, saleOpportunityError };
    } catch (error) {
      console.error("Error fetching sale opportunity:", error);
      return null;
    }
  }

  public async edit(id: number, saleOpportunity: SaleOpportunitySupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(saleOpportunity)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing sale opportunity:", error);
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
      console.error("Error deleting sale opportunities:", error);
      return 0;
    }
  }

  public async deleteBySale(saleId: number) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .delete()
        .eq("sale", saleId)
        .select();

      if (data && data.length > 0 && error === null) {
        return data.length;
      }
      return 0;
    } catch (error) {
      console.error("Error deleting sale opportunities:", error);
      return 0;
    }
  }
}

export default SaleOpportunitiesRepository;
