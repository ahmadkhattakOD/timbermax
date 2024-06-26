import supabase from "utils/supabase";

export interface GeneratedInvoiceSupabase {
  start_date: Date;
  end_date: Date;
  wages: number;
  travel_bonus: number;
  other_bonuses: number;
  total_commission: number;
  cancelled_sales: number;
  deductions: number;
  status: string;
  beneficiary: string;
}

class GeneratedInvoicesRepository {
  private className = "generated_invoices";

  public async create(generatedInvoice: GeneratedInvoiceSupabase) {
    try {
      // const { data: existingInvoiceData, error: existingInvoiceError } =
      //   await supabase
      //     .from(this.className)
      //     .select()
      //     .eq("start_date", invoice.sale)
      //     .eq("beneficiary", invoice.beneficiary);

      // if (
      //   existingInvoiceData &&
      //   existingInvoiceData.length > 0 &&
      //   !existingInvoiceError
      // ) {
      //   return existingInvoiceData[0];
      // } else {
      const { data, error } = await supabase
        .from(this.className)
        .insert(generatedInvoice)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
      // }
    } catch (error) {
      console.error("Error creating new generated invoice:", error);
      return null;
    }
  }

  public async get(
    id: string,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number
    // filters?: ValuesFilterInvoices
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, created_at, start_date, end_date, wages, travel_bonus, other_bonuses, total_commission, cancelled_sales, deductions, status, beneficiary( full_name )",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("beneficiary", id);

      // if (filters) {
      //   if (filters.sale) {
      //     query.eq("sale", filters.sale);
      //   }
      //   if (filters.minimumCommission) {
      //     query.gte("commission", filters.minimumCommission);
      //   }
      //   if (filters.maximumCommission) {
      //     query.lte("commission", filters.maximumCommission);
      //   }
      //   if (filters.invoiceDateFrom) {
      //     query.gte("created_at", filters.invoiceDateFrom);
      //   }
      //   if (filters.invoiceDateTo) {
      //     query.lte("created_at", filters.invoiceDateTo);
      //   }
      // }

      const {
        data: invoicesData,
        count: invoicesCount,
        error: invoicesError,
      } = await query;

      return { invoicesData, invoicesCount, invoicesError };
    } catch (error) {
      console.error("Error fetching generated invoices:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from(this.className)
        .select("*")
        .order("created_at", { ascending: false });

      return { invoicesData, invoicesError };
    } catch (error) {
      console.error("Error fetching generated invoices:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from(this.className)
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { invoiceData, invoiceError };
    } catch (error) {
      console.error("Error fetching generated invoice:", error);
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
      console.error("Error deleting generated invoices:", error);
      return 0;
    }
  }
}
export default GeneratedInvoicesRepository;
