import supabase from "utils/supabase";

export interface OpportunityItemSupabase {
  opportunity: number;
  item: number;
  quantity: number;
}

class OpportunityItemsRepository {
  private className = "opportunity_items";

  public async create(opportunityItem: OpportunityItemSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(opportunityItem)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new opportunity item:", error);
      return null;
    }
  }

  public async get(id: number) {
    try {
      const { data: opportunityItemsData, error: opportunityItemsError } =
        await supabase
          .from(this.className)
          .select("*")
          .order("created_at", { ascending: true })
          .eq("opportunity", id);

      return { opportunityItemsData, opportunityItemsError };
    } catch (error) {
      console.error("Error fetching opportunity items:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: opportunityItemData, error: opportunityItemError } =
        await supabase
          .from(this.className)
          .select("*")
          .eq("id", id)
          .limit(1)
          .maybeSingle();

      return { opportunityItemData, opportunityItemError };
    } catch (error) {
      console.error("Error fetching opportunity item:", error);
      return null;
    }
  }

  public async edit(id: number, opportunityItem: OpportunityItemSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(opportunityItem)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing opportunity item:", error);
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
      console.error("Error deleting opportunity items:", error);
      return 0;
    }
  }

  public async deleteByOpportunity(opportunityId: number) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .delete()
        .eq("opportunity", opportunityId)
        .select();

      if (data && data.length > 0 && error === null) {
        return data.length;
      }
      return 0;
    } catch (error) {
      console.error("Error deleting opportunity items:", error);
      return 0;
    }
  }
}

export default OpportunityItemsRepository;
