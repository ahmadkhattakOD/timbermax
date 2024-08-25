import { ValuesFilterOpportunityDescriptions } from "pages/opportunity-descriptions/main/useOpportunityDescriptions";
import supabase from "utils/supabase";

export interface OpportunityDescriptionSupabase {
  name: string;
  description: string;
}

class OpportunityDescriptionsRepository {
  private className = "opportunity_descriptions";

  public async create(opportunity: OpportunityDescriptionSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(opportunity)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new opportunity description:", error);
      return null;
    }
  }

  public async get(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterOpportunityDescriptions
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
      }

      const {
        data: opportunitiesData,
        count: opportunitiesCount,
        error: opportunitiesError,
      } = await query;

      return { opportunitiesData, opportunitiesCount, opportunitiesError };
    } catch (error) {
      console.error("Error fetching opportunity descriptions:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: opportunitiesData, error: opportunitiesError } =
        await supabase
          .from(this.className)
          .select("*")
          .order("created_at", { ascending: false });

      return { opportunitiesData, opportunitiesError };
    } catch (error) {
      console.error("Error fetching opportunity descriptions:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: opportunityData, error: opportunityError } = await supabase
        .from(this.className)
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { opportunityData, opportunityError };
    } catch (error) {
      console.error("Error fetching opportunity description:", error);
      return null;
    }
  }

  public async edit(id: number, opportunity: OpportunityDescriptionSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(opportunity)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing opportunity description:", error);
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
      console.error("Error deleting opportunity descriptions:", error);
      return 0;
    }
  }
}
export default OpportunityDescriptionsRepository;
