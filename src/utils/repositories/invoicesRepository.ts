import { extendedDataLimit } from "utils/helpers";
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
          .select()
          .eq("sale", invoice.sale)
          .eq("beneficiary", invoice.beneficiary);

      if (
        existingInvoiceData &&
        existingInvoiceData.length > 0 &&
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

  public async get(
    id: string,
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
          "id, sale ( contact_name, opportunity_description, deposit, total, payment_method, phone, address, state, post_code, email_address, note, status, follow_up_notes, sale_date, sales_person( full_name ), closer ( full_name ), show ( name ) ), commission, beneficiary( full_name )",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("beneficiary", id);

      return { invoicesData, invoicesCount, invoicesError };
    } catch (error) {
      console.error("Error fetching invoices:", error);
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

  public async getWithExtendedLimit(id: string) {
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from(this.className)
        .select("commission, sale ( status, total, deposit ) ")
        .order("created_at", { ascending: false })
        .eq("beneficiary", id)
        .limit(extendedDataLimit);

      return { invoicesData, invoicesError };
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
