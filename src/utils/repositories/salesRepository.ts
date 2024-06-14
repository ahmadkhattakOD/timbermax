import supabase from "utils/supabase";

export interface SaleSupabase {
  contact_name: string;
  opportunity_description: string;
  deposit: number;
  total: number;
  payment_method: string;
  phone: string;
  address: string;
  state: string;
  post_code: string;
  email_address: string;
  note: string;
  sales_person?: string;
  closer?: string;
  status: string;
  show?: number;
  follow_up_notes: string;
  sale_date: Date;
}

class SalesRepository {
  private className = "sales";

  public async create(sale: SaleSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(sale)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new sale:", error);
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
        data: salesData,
        count: salesCount,
        error: salesError,
      } = await supabase
        .from(this.className)
        .select(
          "id, contact_name, opportunity_description, deposit, total, payment_method, phone, address, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show ( name ), note, status, follow_up_notes, sale_date",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      return { salesData, salesCount, salesError };
    } catch (error) {
      console.error("Error fetching sales:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: saleData, error: saleError } = await supabase
        .from(this.className)
        .select(
          "id, contact_name, opportunity_description, deposit, total, payment_method, phone, address, state, post_code, email_address, sales_person ( id, full_name ), closer ( id, full_name ), show ( id, name ), note, status, follow_up_notes, sale_date"
        )
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { saleData, saleError };
    } catch (error) {
      console.error("Error fetching sale:", error);
      return null;
    }
  }

  public async edit(id: number, sale: SaleSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(sale)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing sale:", error);
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
      console.error("Error deleting sales:", error);
      return 0;
    }
  }
}

export default SalesRepository;
