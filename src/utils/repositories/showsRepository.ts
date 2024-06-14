import supabase from "utils/supabase";

export interface ShowSupabase {
  name: string;
  start_date?: Date | null;
  end_date?: Date | null;
  address: string;
  suburb: string;
  state: string;
  post_code: string;
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
    limit: number
  ) {
    try {
      const {
        data: showsData,
        count: showsCount,
        error: showsError,
      } = await supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

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
        .order('created_at', { ascending: false })

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
      console.error("Error deleting shows:", error);
      return 0;
    }
  }
}
export default ShowsRepository;
