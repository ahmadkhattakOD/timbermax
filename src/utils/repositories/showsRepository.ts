import { ValuesFilterShows } from "pages/shows/main/useShows";
import { getDateFormattedForField } from "utils/helpers";
import supabase from "utils/supabase";

export interface ShowSupabase {
  name: string;
  start_date?: Date | null;
  end_date?: Date | null;
  address: string;
  suburb: string;
  state: string;
  post_code: string;
  notes: string;
}

class ShowsRepository {
  private className = "shows";

  public async create(show: ShowSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(show)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new show:", error);
      return null;
    }
  }

  public async get(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterShows
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
        if (filters.startDateFrom) {
          query.gte("start_date", filters.startDateFrom);
        }
        if (filters.startDateTo) {
          query.lte("start_date", filters.startDateTo);
        }
        if (filters.endDateFrom) {
          query.gte("end_date", filters.endDateFrom);
        }
        if (filters.endDateTo) {
          query.lte("end_date", filters.endDateTo);
        }
        if (filters.address) {
          query.ilike("address", `%${filters.address}%`);
        }
        if (filters.suburb) {
          query.ilike("suburb", `%${filters.suburb}%`);
        }
        if (filters.state) {
          query.eq("state", filters.state);
        }
        if (filters.postCode) {
          query.eq("post_code", filters.postCode);
        }
      }

      const {
        data: showsData,
        count: showsCount,
        error: showsError,
      } = await query;

      return { showsData, showsCount, showsError };
    } catch (error) {
      console.error("Error fetching shows:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: showsData, error: showsError } = await supabase
        .from(this.className)
        .select("*")
        .order("created_at", { ascending: false });

      return { showsData, showsError };
    } catch (error) {
      console.error("Error fetching shows:", error);
      return null;
    }
  }

  public async getUpcoming() {
    try {
      const { data: showsData, error: showsError } = await supabase
        .from(this.className)
        .select("*")
        .order("created_at", { ascending: true })
        .gte("start_date", getDateFormattedForField())
        .limit(5);

      return { showsData, showsError };
    } catch (error) {
      console.error("Error fetching shows:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: showData, error: showError } = await supabase
        .from(this.className)
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { showData, showError };
    } catch (error) {
      console.error("Error fetching show:", error);
      return null;
    }
  }

  public async edit(id: number, show: ShowSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(show)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing show:", error);
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
      console.error("Error deleting shows:", error);
      return 0;
    }
  }
}
export default ShowsRepository;
