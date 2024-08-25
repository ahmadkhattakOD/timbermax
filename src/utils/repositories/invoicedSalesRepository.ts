import { ValuesFilterSales } from "pages/sales/main/useSales";
import supabase from "utils/supabase";

export interface InvoicedSaleSupabase {
  generated_invoice: number;
  contact_name: string;
  customer: number;
  opportunity_descriptions: string[];
  deposit: number;
  total: number;
  payment_method: string;
  phone: string;
  mobile: string;
  address: string;
  suburb: string;
  state: string;
  post_code: string;
  email_address: string;
  note: string;
  sales_person?: string;
  closer?: string;
  status: string;
  show_name?: string;
  follow_up_notes: string;
  sale_date: Date;
  delivery_date_time?: Date;
  stock_from_warehouse_name?: string;
}

class InvoicedSalesRepository {
  private className = "invoiced_sales";

  public async create(sale: InvoicedSaleSupabase) {
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
      console.error("Error creating new invoiced sale:", error);
      return null;
    }
  }

  public async get(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterSales
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, contact_name, customer( id, name ), opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show_name, note, status, milestone, expected_close_date, lost_reason, status_changed_at, follow_up_notes, sale_date",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      if (filters) {
        if (filters.contactName) {
          query.ilike("contact_name", `%${filters.contactName}%`);
        }
        if (filters.salesPerson) {
          query.eq("sales_person", filters.salesPerson);
        }
        if (filters.minimumDeposit) {
          query.gte("deposit", parseFloat(filters.minimumDeposit));
        }
        if (filters.maximumDeposit) {
          query.lte("deposit", parseFloat(filters.maximumDeposit));
        }
        if (filters.minimumTotal) {
          query.gte("total", parseFloat(filters.minimumTotal));
        }
        if (filters.maximumTotal) {
          query.gte("total", parseFloat(filters.maximumTotal));
        }
        if (filters.paymentMethod) {
          query.eq("payment_method", filters.paymentMethod);
        }
        if (filters.phone) {
          query.eq("phone", filters.phone);
        }
        if (filters.mobile) {
          query.eq("mobile", filters.mobile);
        }
        if (filters.address) {
          query.ilike("address", `%${filters.address}%`);
        }
        if (filters.state) {
          query.eq("state", filters.state);
        }
        if (filters.postCode) {
          query.eq("post_code", filters.postCode);
        }
        if (filters.emailAddress) {
          query.ilike("email_address", `%${filters.emailAddress}%`);
        }
        if (filters.opportunityDescription) {
          query.contains("opportunity_descriptions", [
            filters.opportunityDescription,
          ]);
        }
        if (filters.closer) {
          query.eq("closer", filters.closer);
        }
        if (filters.status) {
          query.eq("status", filters.status);
        }
        // if (filters.show) {
        //   query.eq("show", parseInt(filters.show));
        // }
        if (filters.saleDateFrom) {
          query.gte("sale_date", filters.saleDateFrom);
        }
        if (filters.saleDateTo) {
          query.lte("sale_date", filters.saleDateTo);
        }
        if (filters.closed) {
          if (filters.closed === "yes") {
            query.eq("closed", true);
          } else {
            query.eq("closed", false);
          }
        }
      }

      const {
        data: salesData,
        count: salesCount,
        error: salesError,
      } = await query;

      return { salesData, salesCount, salesError };
    } catch (error) {
      console.error("Error fetching invoiced sales:", error);
      return null;
    }
  }

  public async getInvoicable(
    id: number,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterSales
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, contact_name, customer( id, name ), opportunity_descriptions, deposit, total, commission, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show_name, note, status, milestone, expected_close_date, lost_reason, status_changed_at, follow_up_notes, sale_date, created_at",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("nature", "invoicable")
        .eq("generated_invoice", id);

      if (filters) {
        if (filters.contactName) {
          query.ilike("contact_name", `%${filters.contactName}%`);
        }
        if (filters.salesPerson) {
          query.eq("sales_person", filters.salesPerson);
        }
        if (filters.minimumDeposit) {
          query.gte("deposit", parseFloat(filters.minimumDeposit));
        }
        if (filters.maximumDeposit) {
          query.lte("deposit", parseFloat(filters.maximumDeposit));
        }
        if (filters.minimumTotal) {
          query.gte("total", parseFloat(filters.minimumTotal));
        }
        if (filters.maximumTotal) {
          query.gte("total", parseFloat(filters.maximumTotal));
        }
        if (filters.paymentMethod) {
          query.eq("payment_method", filters.paymentMethod);
        }
        if (filters.phone) {
          query.eq("phone", filters.phone);
        }
        if (filters.mobile) {
          query.eq("mobile", filters.mobile);
        }
        if (filters.address) {
          query.ilike("address", `%${filters.address}%`);
        }
        if (filters.state) {
          query.eq("state", filters.state);
        }
        if (filters.postCode) {
          query.eq("post_code", filters.postCode);
        }
        if (filters.emailAddress) {
          query.ilike("email_address", `%${filters.emailAddress}%`);
        }
        if (filters.opportunityDescription) {
          query.contains("opportunity_descriptions", [
            filters.opportunityDescription,
          ]);
        }
        if (filters.closer) {
          query.eq("closer", filters.closer);
        }
        if (filters.status) {
          query.eq("status", filters.status);
        }
        // if (filters.show) {
        //   query.eq("show", parseInt(filters.show));
        // }
        if (filters.saleDateFrom) {
          query.gte("sale_date", filters.saleDateFrom);
        }
        if (filters.saleDateTo) {
          query.lte("sale_date", filters.saleDateTo);
        }
        if (filters.closed) {
          if (filters.closed === "yes") {
            query.eq("closed", true);
          } else {
            query.eq("closed", false);
          }
        }
      }

      const {
        data: salesData,
        count: salesCount,
        error: salesError,
      } = await query;

      return { salesData, salesCount, salesError };
    } catch (error) {
      console.error("Error fetching invoiced sales:", error);
      return null;
    }
  }

  public async getCancelled(
    id: number,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterSales
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, contact_name, customer( id, name ), opportunity_descriptions, deposit, total, commission, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show_name, note, status, milestone, expected_close_date, lost_reason, status_changed_at, follow_up_notes, sale_date, created_at",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("nature", "cancelled")
        .eq("generated_invoice", id);

      if (filters) {
        if (filters.contactName) {
          query.ilike("contact_name", `%${filters.contactName}%`);
        }
        if (filters.salesPerson) {
          query.eq("sales_person", filters.salesPerson);
        }
        if (filters.minimumDeposit) {
          query.gte("deposit", parseFloat(filters.minimumDeposit));
        }
        if (filters.maximumDeposit) {
          query.lte("deposit", parseFloat(filters.maximumDeposit));
        }
        if (filters.minimumTotal) {
          query.gte("total", parseFloat(filters.minimumTotal));
        }
        if (filters.maximumTotal) {
          query.gte("total", parseFloat(filters.maximumTotal));
        }
        if (filters.paymentMethod) {
          query.eq("payment_method", filters.paymentMethod);
        }
        if (filters.phone) {
          query.eq("phone", filters.phone);
        }
        if (filters.mobile) {
          query.eq("mobile", filters.mobile);
        }
        if (filters.address) {
          query.ilike("address", `%${filters.address}%`);
        }
        if (filters.state) {
          query.eq("state", filters.state);
        }
        if (filters.postCode) {
          query.eq("post_code", filters.postCode);
        }
        if (filters.emailAddress) {
          query.ilike("email_address", `%${filters.emailAddress}%`);
        }
        if (filters.opportunityDescription) {
          query.contains("opportunity_descriptions", [
            filters.opportunityDescription,
          ]);
        }
        if (filters.closer) {
          query.eq("closer", filters.closer);
        }
        if (filters.status) {
          query.eq("status", filters.status);
        }
        // if (filters.show) {
        //   query.eq("show", parseInt(filters.show));
        // }
        if (filters.saleDateFrom) {
          query.gte("sale_date", filters.saleDateFrom);
        }
        if (filters.saleDateTo) {
          query.lte("sale_date", filters.saleDateTo);
        }
        if (filters.closed) {
          if (filters.closed === "yes") {
            query.eq("closed", true);
          } else {
            query.eq("closed", false);
          }
        }
      }

      const {
        data: salesData,
        count: salesCount,
        error: salesError,
      } = await query;

      return { salesData, salesCount, salesError };
    } catch (error) {
      console.error("Error fetching invoiced sales:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: salesData, error: salesError } = await supabase
        .from(this.className)
        .select("*")
        .order("created_at", { ascending: false });

      return { salesData, salesError };
    } catch (error) {
      console.error("Error fetching invoiced sales:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: saleData, error: saleError } = await supabase
        .from(this.className)
        .select(
          "id, contact_name, customer( id, name ), opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( id, full_name ), closer ( id, full_name ), show_name, note, status, milestone, expected_close_date, lost_reason, status_changed_at, follow_up_notes, sale_date, closed, stock_from_warehouse_name, delivery_date_time, invoice_date"
        )
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { saleData, saleError };
    } catch (error) {
      console.error("Error fetching invoiced sale:", error);
      return null;
    }
  }

  public async getByGeneratedInvoice(id: number) {
    try {
      const { data: saleData, error: saleError } = await supabase
        .from(this.className)
        .select(
          "id, contact_name, customer( id, name ), opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( id, full_name ), closer ( id, full_name ), show_name, note, status, milestone, expected_close_date, lost_reason, status_changed_at, follow_up_notes, sale_date, closed, stock_from_warehouse_name, delivery_date_time, invoice_date"
        )
        .eq("generated_invoice", id)
        .limit(1)
        .maybeSingle();

      return { saleData, saleError };
    } catch (error) {
      console.error("Error fetching invoiced sale:", error);
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
      console.error("Error deleting invoiced sales:", error);
      return 0;
    }
  }
}

export default InvoicedSalesRepository;
