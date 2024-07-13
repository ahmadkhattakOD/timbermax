import { ValuesFilterCloseSales } from "pages/close/main/useCloseSales";
import { ValuesFilterDeliveries } from "pages/deliveries/main/useDeliveries";
import { ValuesFilterSelectSales } from "pages/deliveries/select/useSelectSale";
import { ValuesFilterSales } from "pages/sales/main/useSales";
import { ValuesFilterViewSales } from "pages/view-sales/main/useViewSales";
import {
  getDateFormatted,
  getDateFormattedForField,
  getMonthName,
} from "utils/helpers";
import supabase from "utils/supabase";

export interface SaleSupabase {
  contact_name: string;
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
  show?: number;
  follow_up_notes: string;
  sale_date: Date;
  delivery_date_time?: Date;
  stock_from_warehouse?: number;
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
    limit: number,
    filters?: ValuesFilterSales
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, contact_name, opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show ( name ), note, status, status_changed_at, follow_up_notes, sale_date",
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
        if (filters.show) {
          query.eq("show", parseInt(filters.show));
        }
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
      console.error("Error fetching sales:", error);
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
      console.error("Error fetching sales:", error);
      return null;
    }
  }

  public async getForCloser(
    closerId: string,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterCloseSales
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, contact_name, opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show ( name ), note, status, status_changed_at, follow_up_notes, sale_date",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("closer", closerId);

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
        if (filters.closed) {
          if (filters.closed === "yes") {
            query.eq("closed", true);
          } else {
            query.eq("closed", false);
          }
        }
        if (filters.status) {
          query.eq("status", filters.status);
        }
        if (filters.show) {
          query.eq("show", parseInt(filters.show));
        }
        if (filters.saleDateFrom) {
          query.gte("sale_date", filters.saleDateFrom);
        }
        if (filters.saleDateTo) {
          query.lte("sale_date", filters.saleDateTo);
        }
      }

      const {
        data: salesData,
        count: salesCount,
        error: salesError,
      } = await query;

      return { salesData, salesCount, salesError };
    } catch (error) {
      console.error("Error fetching sales:", error);
      return null;
    }
  }

  public async getForSalesPerson(
    salesPersonId: string,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterViewSales
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, contact_name, opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, mobile, address, suburb, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show ( name ), note, status, status_changed_at, follow_up_notes, sale_date",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("sales_person", salesPersonId);

      if (filters) {
        if (filters.contactName) {
          query.ilike("contact_name", `%${filters.contactName}%`);
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
        if (filters.closed) {
          if (filters.closed === "yes") {
            query.eq("closed", true);
          } else if (filters.closed === "no") {
            query.eq("closed", false);
          }
        }
        if (filters.status) {
          query.eq("status", filters.status);
        }
        if (filters.show) {
          query.eq("show", parseInt(filters.show));
        }
        if (filters.saleDateFrom) {
          query.gte("sale_date", filters.saleDateFrom);
        }
        if (filters.saleDateTo) {
          query.lte("sale_date", filters.saleDateTo);
        }
      }

      const {
        data: salesData,
        count: salesCount,
        error: salesError,
      } = await query;

      return { salesData, salesCount, salesError };
    } catch (error) {
      console.error("Error fetching sales:", error);
      return null;
    }
  }

  public async getDelivered(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterDeliveries
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, contact_name, opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show ( name ), note, status, status_changed_at, follow_up_notes, sale_date, stock_from_warehouse ( name ), delivery_date_time, invoice_date",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("status", "delivered");

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
        if (filters.show) {
          query.eq("show", parseInt(filters.show));
        }
        if (filters.saleDateFrom) {
          query.gte("sale_date", filters.saleDateFrom);
        }
        if (filters.saleDateTo) {
          query.lte("sale_date", filters.saleDateTo);
        }
      }

      const {
        data: salesData,
        count: salesCount,
        error: salesError,
      } = await query;

      return { salesData, salesCount, salesError };
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      return null;
    }
  }

  public async getDeliveredCsv(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterDeliveries
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, contact_name, opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show ( name ), note, status, status_changed_at, follow_up_notes, sale_date, stock_from_warehouse ( name ), delivery_date_time, invoice_date"
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("status", "delivered");

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
        if (filters.show) {
          query.eq("show", parseInt(filters.show));
        }
        if (filters.saleDateFrom) {
          query.gte("sale_date", filters.saleDateFrom);
        }
        if (filters.saleDateTo) {
          query.lte("sale_date", filters.saleDateTo);
        }
      }

      const { data: salesData, error: salesError } = await query.csv();

      return { salesData, salesError };
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      return null;
    }
  }

  public async getUndelivered(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterSelectSales
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          "id, contact_name, opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( full_name ), closer ( full_name ), show ( name ), note, status, status_changed_at, follow_up_notes, sale_date",
          { count: "exact" }
        )
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .neq("status", "delivered");

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
        if (filters.show) {
          query.eq("show", parseInt(filters.show));
        }
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
      console.error("Error fetching sales:", error);
      return null;
    }
  }

  public async getTotalSalesForYear(
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
        query.or(`sales_person.eq.${userId},closer.eq.${userId}`);
      }

      const { data: salesData, error: salesError } = await query;

      const totalSalesCount: { [month: string]: number } = {
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
      if (salesData && !salesError) {
        for (let i = 0; i < salesData.length; i++) {
          const saleDate = new Date(salesData[i].sale_date);
          const month = getMonthName(saleDate);

          if (!totalSalesCount[month]) {
            totalSalesCount[month] = 0;
          }

          totalSalesCount[month] += salesData[i].total;
        }
      }

      return Object.keys(totalSalesCount).map((month) => ({
        month,
        sales: totalSalesCount[month],
      }));
    } catch (error) {
      console.error("Error fetching sales:", error);
      return [];
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: saleData, error: saleError } = await supabase
        .from(this.className)
        .select(
          "id, contact_name, opportunity_description, opportunity_descriptions, deposit, total, payment_method, phone, mobile, address, suburb, state, post_code, email_address, sales_person ( id, full_name ), closer ( id, full_name ), show ( id, name ), note, status, status_changed_at, follow_up_notes, sale_date, closed, stock_from_warehouse ( id, name ), delivery_date_time, invoice_date, invoiced"
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

  public async close(id: number, status: string, followUpNotes: string) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({
          status: status,
          follow_up_notes: followUpNotes,
          closed: true,
        })
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error closing sale:", error);
      return null;
    }
  }

  public async deliver(
    id: number,
    followUpNotes: string,
    deliveryDateTime: Date,
    stockFromWarehouse: number
  ) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({
          status: "delivered",
          follow_up_notes: followUpNotes,
          closed: true,
          delivery_date_time: deliveryDateTime,
          stock_from_warehouse: stockFromWarehouse,
        })
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error delivering sale:", error);
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

  public async markAsInvoiced(
    startDate: string,
    endDate: string,
    userId: string,
    generatedInvoiceId: number
  ) {
    try {
      const { data, error } = await supabase.rpc("update_invoiced_sales", {
        p_start_date: startDate,
        p_end_date: endDate,
        p_beneficiary_id: userId,
        p_generated_invoice_id: generatedInvoiceId
      });

      if (error === null) {
        return true;
      }
      return null;
    } catch (error) {
      console.error("Error delivering sale:", error);
      return null;
    }
  }

  public async markCancelledAsInvoiced(
    startDate: string,
    endDate: string,
    userId: string,
    generatedInvoiceId: number
  ) {
    try {
      const { data, error } = await supabase.rpc("update_invoiced_cancelled_sales", {
        p_start_date: startDate,
        p_end_date: endDate,
        p_beneficiary_id: userId,
        p_generated_invoice_id: generatedInvoiceId
      });

      if (error === null) {
        return true;
      }
      return null;
    } catch (error) {
      console.error("Error delivering sale:", error);
      return null;
    }
  }
}

export default SalesRepository;
