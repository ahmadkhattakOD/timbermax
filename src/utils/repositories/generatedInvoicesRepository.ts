import { ValuesFilterGeneratedInvoices } from "pages/invoices/view/useViewInvoices";
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
    limit: number,
    filters?: ValuesFilterGeneratedInvoices
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

      if (filters) {
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
        if (filters.minimumWages) {
          query.gte("wages", filters.minimumWages);
        }
        if (filters.maximumWages) {
          query.lte("wages", filters.maximumWages);
        }
        if (filters.minimumTravelBonus) {
          query.gte("travel_bonus", filters.minimumTravelBonus);
        }
        if (filters.maximumTravelBonus) {
          query.lte("travel_bonus", filters.maximumTravelBonus);
        }
        if (filters.minimumOtherBonuses) {
          query.gte("other_bonuses", filters.minimumOtherBonuses);
        }
        if (filters.maximumOtherBonuses) {
          query.lte("other_bonuses", filters.maximumOtherBonuses);
        }
        if (filters.minimumTotalCommission) {
          query.gte("total_commission", filters.minimumTotalCommission);
        }
        if (filters.maximumTotalCommission) {
          query.lte("total_commission", filters.maximumTotalCommission);
        }
        if (filters.minimumCancelledSales) {
          query.gte("cancelled_sales", filters.minimumCancelledSales);
        }
        if (filters.maximumCancelledSales) {
          query.lte("cancelled_sales", filters.maximumCancelledSales);
        }
        if (filters.minimumDeductions) {
          query.gte("deductions", filters.minimumDeductions);
        }
        if (filters.maximumDeductions) {
          query.lte("deductions", filters.maximumDeductions);
        }
        if (filters.status) {
          query.eq("status", filters.status);
        }
        if (filters.generatedAtFrom) {
          query.gte("created_at", filters.generatedAtFrom);
        }
        if (filters.generatedAtTo) {
          query.lte("created_at", filters.generatedAtTo);
        }
      }

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

  public async checkExistence(
    userId: string,
    startDateFrom: string,
    startDateTo: string
  ) {
    try {
      const { data: invoiceData1, error: invoiceError1 } = await supabase
        .from(this.className)
        .select("start_date, end_date")
        .eq("beneficiary", userId)
        .gte("start_date", startDateFrom)
        .gte("end_date", startDateTo)
        .lte("start_date", startDateTo)
        // .or(`start_date.gt.${startDateFrom} AND end_date.gt.${startDateTo}`)
        // .or(`start_date.lt.${startDateFrom} AND end_date.lt.${startDateTo}`)
        // .or(`start_date.lt.${startDateFrom} AND end_date.gt.${startDateTo}`)
        // .or(`start_date.gt.${startDateFrom} AND end_date.lt.${startDateTo}`)
        .limit(1)
        .maybeSingle();

      if (invoiceData1 && !invoiceError1) {
        return { invoiceData: invoiceData1, invoiceError: invoiceError1 };
      } else {
        const { data: invoiceData2, error: invoiceError2 } = await supabase
          .from(this.className)
          .select("start_date, end_date")
          .eq("beneficiary", userId)
          .lte("start_date", startDateFrom)
          .lte("end_date", startDateTo)
          .gte("end_date", startDateFrom)
          .limit(1)
          .maybeSingle();
        if (invoiceData2 && !invoiceError2) {
          return { invoiceData: invoiceData2, invoiceError: invoiceError2 };
        } else {
          const { data: invoiceData3, error: invoiceError3 } = await supabase
            .from(this.className)
            .select("start_date, end_date")
            .eq("beneficiary", userId)
            .lte("start_date", startDateFrom)
            .gte("end_date", startDateTo)
            .limit(1)
            .maybeSingle();
          if (invoiceData3 && !invoiceError3) {
            return { invoiceData: invoiceData3, invoiceError: invoiceError3 };
          } else {
            const { data: invoiceData4, error: invoiceError4 } = await supabase
              .from(this.className)
              .select("start_date, end_date")
              .eq("beneficiary", userId)
              .gte("start_date", startDateFrom)
              .lte("end_date", startDateTo)
              .limit(1)
              .maybeSingle();
            if (invoiceData4 && !invoiceError4) {
              return { invoiceData: invoiceData4, invoiceError: invoiceError4 };
            } else {
              return null;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching generated invoice:", error);
      return null;
    }
  }

  public async changeBulkStatus(ids: readonly number[], status: string) {
    try {
      let updatedIdsCount = 0;
      for (let i = 0; i < ids.length; i++) {
        const { data, error } = await supabase
          .from(this.className)
          .update({ status: status })
          .eq("id", ids[i])
          .select();

        if (data && data.length > 0 && error === null) {
          updatedIdsCount += 1;
        }
      }

      return updatedIdsCount;
    } catch (error) {
      console.error("Error bulk updating generated invoices status:", error);
      return 0;
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
