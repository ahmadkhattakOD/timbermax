import {
  ValuesFilterCancelled,
  ValuesFilterInvoices,
} from "pages/invoices/create/useCreateInvoice";
import { ValuesFilterSales } from "pages/view-invoices-sales-closer/download/useDownloadInvoiceSalesCloser";
import {
  extendedDataLimit,
  getDateFormattedForField,
  getMonthName,
} from "utils/helpers";
import supabase from "utils/supabase";

export interface InvoiceSupabase {
  sale: number;
  commission: number;
  beneficiary: string;
}

class InvoicesRepository {
  private className = "invoices";

  public async create(invoice: InvoiceSupabase) {
    try {
      const { data: existingInvoiceData, error: existingInvoiceError } =
        await supabase
          .from(this.className)
          .select("sale (id, sales_person, closer) ")
          .eq("sale", invoice.sale)
          .eq("beneficiary", invoice.beneficiary);

      let limit = 1;
      if (existingInvoiceData && !existingInvoiceError) {
        for (let i = 0; i < existingInvoiceData.length; i++) {
          const sale = existingInvoiceData[i].sale as any;
          if (sale && sale.sales_person == sale.closer) {
            limit = 2;
          }
        }
      }

      if (
        existingInvoiceData &&
        existingInvoiceData.length >= limit &&
        !existingInvoiceError
      ) {
        return existingInvoiceData[0];
      } else {
        const { data, error } = await supabase
          .from(this.className)
          .insert(invoice)
          .select();

        if (data && data.length > 0 && error === null) {
          return data[0];
        }
        return null;
      }
    } catch (error) {
      console.error("Error creating new invoice:", error);
      return null;
    }
  }

  public async findAndDelete(saleId: number, beneficiaryId: string) {
    try {
      const { data: existingInvoiceData, error: existingInvoiceError } =
        await supabase
          .from(this.className)
          .select("id, sale (id, sales_person, closer) ")
          .eq("sale", saleId)
          .eq("beneficiary", beneficiaryId);

      if (existingInvoiceData && !existingInvoiceError) {
        const idsToDelete: number[] = [];
        for (let i = 0; i < existingInvoiceData.length; i++) {
          idsToDelete.push(existingInvoiceData[i].id);
        }
        const deleted = await this.delete(idsToDelete);
        if (deleted === idsToDelete.length) {
          return true;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error updating previous invoice:", error);
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
    saleDateFrom: string,
    saleDateTo: string,
    filters?: ValuesFilterInvoices
  ) {
    try {
      const query = supabase
        .rpc(
          "fetch_invoices",
          {
            p_beneficiary_id: id,
            p_start_date: saleDateFrom,
            p_end_date: saleDateTo,
          },
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      if (filters) {
        if (filters.sale) {
          query.eq("sale_id", filters.sale);
        }
        if (filters.minimumCommission) {
          query.gte("commission", filters.minimumCommission);
        }
        if (filters.maximumCommission) {
          query.lte("commission", filters.maximumCommission);
        }
        if (filters.invoiceDateFrom) {
          query.gte("created_at", filters.invoiceDateFrom);
        }
        if (filters.invoiceDateTo) {
          query.lte("created_at", filters.invoiceDateTo);
        }
      }

      const {
        data: invoicesData,
        count: invoicesCount,
        error: invoicesError,
      } = await query;

      return { invoicesData, invoicesCount, invoicesError };
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return null;
    }
  }

  public async getWithExtendedLimit(
    id: string,
    saleDateFrom: string,
    saleDateTo: string
  ) {
    try {
      const query = supabase
        .rpc(
          "fetch_invoices",
          {
            p_beneficiary_id: id,
            p_start_date: saleDateFrom,
            p_end_date: saleDateTo,
          },
          { count: "exact" }
        )
        .order("created_at", { ascending: true })
        .limit(extendedDataLimit);

      const {
        data: invoicesData,
        count: invoicesCount,
        error: invoicesError,
      } = await query;

      return { invoicesData, invoicesCount, invoicesError };
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return null;
    }
  }

  public async getForSalesCloser(
    id: string,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    saleDateFrom: string,
    saleDateTo: string,
    filters?: ValuesFilterSales
  ) {
    try {
      // const query = supabase
      //   .from(this.className)
      //   .select(
      //     "id, created_at, sale!inner ( contact_name, opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, note, status, follow_up_notes, sale_date, sales_person( full_name ), closer ( full_name ), show ( name ), delivery_date_time, stock_from_warehouse (name) ), commission, beneficiary( full_name )",
      //     { count: "exact" }
      //   )
      //   .order(orderBy, { ascending: ascending })
      //   .range(rangeStart, rangeEnd)
      //   .limit(limit)
      //   .eq("beneficiary", id);

      const query = supabase
        .rpc(
          "fetch_invoiced_invoices",
          {
            p_beneficiary_id: id,
            p_start_date: saleDateFrom,
            p_end_date: saleDateTo,
          },
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      if (filters) {
        if (filters.minimumCommission) {
          query.gte("commission", filters.minimumCommission);
        }
        if (filters.maximumCommission) {
          query.lte("commission", filters.maximumCommission);
        }
        if (filters.invoiceDateFrom) {
          query.gte("created_at", filters.invoiceDateFrom);
        }
        if (filters.invoiceDateTo) {
          query.lte("created_at", filters.invoiceDateTo);
        }
      }
      // if (saleDateFrom !== "") {
      //   query.gte("sale.sale_date", saleDateFrom);
      // }
      // if (saleDateTo !== "") {
      //   query.lte("sale.sale_date", saleDateTo);
      // }

      const {
        data: invoicesData,
        count: invoicesCount,
        error: invoicesError,
      } = await query;

      return { invoicesData, invoicesCount, invoicesError };
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return null;
    }
  }

  public async getBySale(
    id: number,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number
  ) {
    try {
      const {
        data: invoicesData,
        count: invoicesCount,
        error: invoicesError,
      } = await supabase
        .from(this.className)
        .select(
          "id, sale ( customer ( id, name ),  contact_name, opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, note, status, milestone, expected_close_date, lost_reason, status_changed_at, follow_up_notes, sale_date, sales_person( full_name ), closer ( full_name ), show ( name ) ), commission, beneficiary( full_name )",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("sale", id);

      return { invoicesData, invoicesCount, invoicesError };
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return null;
    }
  }

  public async checkExistenceBySale(id: number) {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from(this.className)
        .select("id")
        .eq("sale", id)
        .limit(1)
        .maybeSingle();

      return { invoiceData, invoiceError };
    } catch (error) {
      console.error("Error fetching invoice:", error);
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
      console.error("Error fetching invoices:", error);
      return null;
    }
  }

  public async getCancelled(
    id: string,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    saleDateFrom: string,
    saleDateTo: string,
    filters?: ValuesFilterCancelled
  ) {
    try {
      // const query = supabase
      //   .from(this.className)
      //   .select(
      //     "id, commission, sale!inner ( contact_name, status, total, deposit, status_changed_at, sale_date, invoiced )",
      //     { count: "exact" }
      //   )
      //   .eq("beneficiary", id)
      //   .eq("sale.status", "cancelled")
      //   .eq("sale.invoiced", true)
      //   .order(orderBy, { ascending: ascending })
      //   .range(rangeStart, rangeEnd)
      //   .limit(limit);

      const query = supabase
        .rpc(
          "fetch_invoices_cancelled",
          {
            p_beneficiary_id: id,
            p_start_date: saleDateFrom,
            p_end_date: saleDateTo,
          },
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      if (filters) {
        if (filters.sale) {
          query.eq("sale", filters.sale);
        }
        if (filters.minimumCommission) {
          query.gte("commission", filters.minimumCommission);
        }
        if (filters.maximumCommission) {
          query.lte("commission", filters.maximumCommission);
        }
      }

      const {
        data: invoicesData,
        count: invoicesCount,
        error: invoicesError,
      } = await query;

      return { invoicesData, invoicesCount, invoicesError };
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return null;
    }
  }

  public async getCancelledWithExtendedLimit(
    id: string,
    saleDateFrom: string,
    saleDateTo: string
  ) {
    try {
      // const query = supabase
      //   .from(this.className)
      //   .select(
      //     "commission, sale!inner ( status, total, deposit, status_changed_at, invoiced ) "
      //   )
      //   .order("created_at", { ascending: false })
      //   .eq("beneficiary", id)
      //   .eq("sale.status", "cancelled")
      //   .eq("sale.invoiced", true)
      //   .limit(extendedDataLimit);

      const query = supabase
        .rpc(
          "fetch_invoices_cancelled",
          {
            p_beneficiary_id: id,
            p_start_date: saleDateFrom,
            p_end_date: saleDateTo,
          },
          { count: "exact" }
        )
        .order("created_at", { ascending: true })
        .limit(extendedDataLimit);

      // if (saleDateFrom !== "") {
      //   query.gte("sale.status_changed_at", saleDateFrom);
      // }
      // if (saleDateTo !== "") {
      //   query.lte("sale.status_changed_at", saleDateTo);
      // }

      const { data: invoicesData, error: invoicesError } = await query;

      return { invoicesData, invoicesError };
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return null;
    }
  }

  public async getTotalCommissionsForYear(
    year: number,
    userId?: string
  ): Promise<{ month: string; sales: number }[]> {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      const query = supabase
        .from(this.className)
        .select("*")
        .order("created_at", { ascending: false })
        .gte("created_at", getDateFormattedForField(startDate))
        .lte("created_at", getDateFormattedForField(endDate));

      if (userId) {
        query.eq("beneficiary", userId);
      }

      const { data: invoicesData, error: invoicesError } = await query;

      const totalCommissionCount: { [month: string]: number } = {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      };

      if (invoicesData && !invoicesError) {
        for (let i = 0; i < invoicesData.length; i++) {
          const invoiceDate = new Date(invoicesData[i].created_at);
          const month = getMonthName(invoiceDate);

          if (!totalCommissionCount[month]) {
            totalCommissionCount[month] = 0;
          }

          totalCommissionCount[month] += invoicesData[i].commission;
        }
      }

      return Object.keys(totalCommissionCount).map((month) => ({
        month,
        sales: totalCommissionCount[month],
      }));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return [];
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
      console.error("Error fetching invoice:", error);
      return null;
    }
  }

  public async edit(id: number, invoice: InvoiceSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(invoice)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing invoice:", error);
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
      console.error("Error deleting invoices:", error);
      return 0;
    }
  }
}
export default InvoicesRepository;
