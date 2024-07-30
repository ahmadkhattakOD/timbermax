import { ValuesFilterCommunication } from "pages/customers/edit/useEditCustomer";
import supabase from "utils/supabase";

export interface CommunicationSupabase {
  customer: number;
  method: string;
  date?: Date | null; 
  notes: string;
  files: string[];
}

class CommunicationRepository {
  private className = "communication";

  public async create(communication: CommunicationSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(communication)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new communication:", error);
      return null;
    }
  }

  public async get(
    id: number,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterCommunication
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("customer", id);

      if (filters) {
        if (filters.method) {
          query.eq("method", filters.method);
        }
        if (filters.dateFrom) {
          query.gte("date", filters.dateFrom);
        }
        if (filters.dateTo) {
          query.lte("date", filters.dateTo);
        }
      }

      const {
        data: communicationData,
        count: communicationCount,
        error: communicationError,
      } = await query;

      return { communicationData, communicationCount, communicationError };
    } catch (error) {
      console.error("Error fetching communication:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: communicationData, error: communicationError } =
        await supabase
          .from(this.className)
          .select("*")
          .order("created_at", { ascending: false });

      return { communicationData, communicationError };
    } catch (error) {
      console.error("Error fetching communication:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: communicationData, error: communicationError } =
        await supabase
          .from(this.className)
          .select("*")
          .eq("id", id)
          .limit(1)
          .maybeSingle();

      return { communicationData, communicationError };
    } catch (error) {
      console.error("Error fetching communication:", error);
      return null;
    }
  }

  public async edit(id: number, communication: CommunicationSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(communication)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing communication:", error);
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
      console.error("Error deleting communication:", error);
      return 0;
    }
  }
}
export default CommunicationRepository;
