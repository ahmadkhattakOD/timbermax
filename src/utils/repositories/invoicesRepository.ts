import { ValuesFilterInvoices } from "types";
import { getDateFormattedForField } from "utils/helpers";
import supabase from "utils/supabase";
import StocksRepository from "./stocksRepository";

export interface InvoiceSupabase {
  id?: number;
  invoice_number: string;
  customer_id: number;
  quotation_id?: number | null;
  total: number;
  discount?: number;
  discount_type?: "percentage" | "fixed";
  status?: "draft" | "sent" | "paid" | "cancelled" | "converted" | "overdue";
  delivery_status?: "pending" | "packed" | "shipped" | "delivered" | "returned" | "pick_up";
  invoice_date?: Date | string;
  due_date?: Date | string;
  note?: string;
  user?: string;
  created_at?: string;
  updated_at?: string;
  address?: string;
  suburb?: string;
  state?: string;
  post_code?: string;
  payment_method?: string;
  payment_date?: Date | string;
  deposit?: number;
}

export interface InvoiceItemSupabase {
  invoice_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  warehouse_id?: number;
  sort_order?: number;
}

class InvoicesRepository {
  private className = "invoices";
  private itemsClassName = "invoice_items";

  public async getNextInvoiceNumber(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .select("invoice_number")
        .like("invoice_number", "INV-%")
        .order("invoice_number", { ascending: false });

      if (error || !data || data.length === 0) {
        return "INV-0400";
      }

      // Find the highest numeric suffix among INV-XXXX entries
      let maxNum = 399; // so first generated is 400
      for (const row of data) {
        const match = row.invoice_number?.match(/^INV-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }

      const next = maxNum + 1;
      return `INV-${String(next).padStart(4, "0")}`;
    } catch (error) {
      console.error("Error getting next invoice number:", error);
      return "INV-0400";
    }
  }

  public async create(invoice: InvoiceSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(invoice)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating invoice:", error);
      return null;
    }
  }

  public async get(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterInvoices,
  ) {
    try {
      const customerJoin = filters?.customer_name ? "customers!inner" : "customers";

      const query = supabase
        .from(this.className)
        .select(
          `
id,
invoice_number,
delivery_status,

${customerJoin} (
  id, name, phone, mobile, email, address, suburb, state, post_code
),

quotation_id,
quotations (
  quotation_number
),

total,
deposit,
status,
invoice_date,
due_date,
note,
created_at,
updated_at,

${this.itemsClassName} (
  sort_order,
  quantity,
  unit_price,
  items (
    id, name, itemCode, sellPrice,gst
  )
)
`,
          { count: "exact" },
        )

        .order(orderBy, { ascending })
        .order("sort_order", {
          referencedTable: this.itemsClassName,
          ascending: true,
        })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      if (filters) {
        console.log("FILTEDS COMING", filters);
        if (filters.invoice_number) {
          query.ilike("invoice_number", `%${filters.invoice_number}%`);
        }
        if (filters.delivery_status) {
          query.ilike("delivery_status", `%${filters.delivery_status}%`);
        }

        if (filters.customer_name) {
          query.ilike("customers.name", `%${filters.customer_name}%`);
        }

        if (filters.quotation_number) {
          query.ilike(
            "quotations.quotation_number",
            `%${filters.quotation_number}%`,
          );
        }

        if (filters.minimumTotal) {
          query.gte("total", parseFloat(filters.minimumTotal));
        }

        if (filters.maximumTotal) {
          query.lte("total", parseFloat(filters.maximumTotal));
        }

        if (filters.status) {
          query.eq("status", filters.status);
        }

        if (filters.invoice_date_from) {
          query.gte("invoice_date", filters.invoice_date_from);
        }

        if (filters.invoice_date_to) {
          query.lte("invoice_date", filters.invoice_date_to);
        }

        if (filters.due_date_from) {
          query.gte("due_date", filters.due_date_from);
        }

        if (filters.due_date_to) {
          query.lte("due_date", filters.due_date_to);
        }

        if (filters.created_at_from) {
          query.gte("created_at", filters.created_at_from);
        }

        if (filters.created_at_to) {
          query.lte("created_at", filters.created_at_to);
        }

        if (filters.item_name) {
          query.ilike(
            `${this.itemsClassName}.items.name`,
            `%${filters.item_name}%`,
          );
        }

        if (filters.item_code) {
          query.ilike(
            `${this.itemsClassName}.items.itemCode`,
            `%${filters.item_code}%`,
          );
        }
      }

      const { data, count, error } = await query;

      return {
        invoicesData: data,
        invoicesCount: count,
        invoicesError: error,
      };
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

  // Add this method to InvoicesRepository class
  public async updateDeliveryStatus(
    id: number,
    delivery_status:
      | "pending"
      | "packed"
      | "shipped"
      | "delivered"
      | "returned"
      | "pick_up",
  ) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({
          delivery_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating delivery status:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error("Error updating delivery status:", error);
      return { success: false, error: error.message };
    }
  }
  public async getSingle(id: number) {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from(this.className)
        .select(
          `id, invoice_number, delivery_status, customer_id,
         address, suburb, state, post_code,
         customer:customers ( id, name, phone, mobile, email, address, suburb, state, post_code ),
         quotation_id, quotations ( id, quotation_number ),
         total, discount, discount_type, deposit, status, invoice_date, due_date, note, payment_method, payment_date, created_at, updated_at,
         ${this.itemsClassName} (
           id, item_id, quantity, unit_price, total_price, warehouse_id, sort_order,
           items ( id, name, itemCode, sellPrice, gst )
         )`,
        )
        .eq("id", id)
        .order("sort_order", {
          referencedTable: this.itemsClassName,
          ascending: true,
        })
        .order("id", { referencedTable: this.itemsClassName, ascending: true })
        .limit(1)
        .maybeSingle();

      return { invoiceData, invoiceError };
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return null;
    }
  }

  public async getItems(invoiceId: number) {
    try {
      const { data, error } = await supabase
        .from(this.itemsClassName)
        .select(
          `
          *,
          items (id, name, itemCode, sellPrice)
        `,
        )
        .eq("invoice_id", invoiceId)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      return { data, error };
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      return null;
    }
  }

  public async addItem(item: InvoiceItemSupabase & { warehouse_id?: number }) {
    try {
      const { data, error } = await supabase
        .from(this.itemsClassName)
        .insert({
          invoice_id: item.invoice_id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          warehouse_id: item.warehouse_id || 1, // Default to warehouse 1 if not provided
          sort_order: item.sort_order ?? 0,
        })
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error adding invoice item:", error);
      return null;
    }
  }

  public async updateStatus(id: number, status: string) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({ status: status, updated_at: new Date() })
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error updating invoice status:", error);
      return null;
    }
  }

  public async markAsPaid(id: number, paymentMethod?: string, paymentDate?: Date) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({
          status: "paid",
          payment_method: paymentMethod || null,
          updated_at: new Date(),
          payment_date: paymentDate || new Date(),
        })
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
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
      console.error("Error deleting invoices:", error);
      return 0;
    }
  }

  public async deleteItem(invoiceId: number, itemId: number) {
    try {
      const { data, error } = await supabase
        .from(this.itemsClassName)
        .delete()
        .eq("invoice_id", invoiceId)
        .eq("item_id", itemId)
        .select();

      if (data && data.length > 0 && error === null) {
        return data.length;
      }
      return 0;
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      return 0;
    }
  }

  public async updateItem(invoiceId: number, itemId: number, updates: any) {
    try {
      const { data, error } = await supabase
        .from(this.itemsClassName)
        .update(updates)
        .eq("invoice_id", invoiceId)
        .eq("item_id", itemId)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error updating invoice item:", error);
      return null;
    }
  }

  // Get invoices for a specific customer
  public async getByCustomer(
    customerId: number,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterInvoices,
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select(
          `
        id,
        invoice_number,
        delivery_status,
        customers!inner (
          id, name, phone, mobile, email, address, suburb, state, post_code
        ),
        quotation_id,
        quotations (
          quotation_number
        ),
        total,
        deposit,
        status,
        invoice_date,
        due_date,
        note,
        created_at,
        updated_at,
        ${this.itemsClassName} (
          sort_order,
          quantity,
          unit_price,
          items (
            id, name, itemCode, sellPrice, gst
          )
        )
        `,
          { count: "exact" },
        )
        .order(orderBy, { ascending: ascending })
        .order("sort_order", {
          referencedTable: this.itemsClassName,
          ascending: true,
        })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("customer_id", customerId);

      if (filters) {
        if (filters.invoice_number) {
          query.ilike("invoice_number", `%${filters.invoice_number}%`);
        }
        if (filters.minimumTotal) {
          query.gte("total", parseFloat(filters.minimumTotal));
        }
        if (filters.maximumTotal) {
          query.lte("total", parseFloat(filters.maximumTotal));
        }
        if (filters.status) {
          query.eq("status", filters.status);
        }
        if (filters.delivery_status) {
          query.eq("delivery_status", filters.delivery_status);
        }
        if (filters.invoice_date_from) {
          query.gte("invoice_date", filters.invoice_date_from);
        }
        if (filters.invoice_date_to) {
          query.lte("invoice_date", filters.invoice_date_to);
        }
        if (filters.due_date_from) {
          query.gte("due_date", filters.due_date_from);
        }
        if (filters.due_date_to) {
          query.lte("due_date", filters.due_date_to);
        }
        if (filters.created_at_from) {
          query.gte("created_at", filters.created_at_from);
        }
        if (filters.created_at_to) {
          query.lte("created_at", filters.created_at_to);
        }
        if (filters.item_name) {
          query.ilike(
            `${this.itemsClassName}.items.name`,
            `%${filters.item_name}%`,
          );
        }
        if (filters.item_code) {
          query.ilike(
            `${this.itemsClassName}.items.itemCode`,
            `%${filters.item_code}%`,
          );
        }
      }

      const {
        data: invoicesData,
        count: invoicesCount,
        error: invoicesError,
      } = await query;

      if (invoicesError) {
        console.error("Error fetching customer invoices:", invoicesError);
        return { invoicesData: [], invoicesCount: 0, invoicesError };
      }

      return { invoicesData, invoicesCount, invoicesError };
    } catch (error) {
      console.error("Error fetching customer invoices:", error);
      return { invoicesData: [], invoicesCount: 0, invoicesError: error };
    }
  }

  // Get unpaid invoices
  public async getUnpaid() {
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from(this.className)
        .select("*")
        .neq("status", "paid")
        .neq("status", "cancelled")
        .order("invoice_date", { ascending: true });

      return { invoicesData, invoicesError };
    } catch (error) {
      console.error("Error fetching unpaid invoices:", error);
      return null;
    }
  }

  // Update overdue invoices
  public async updateOverdueInvoices() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Find all invoices that are past due date and not paid/cancelled
      const { data, error } = await supabase
        .from(this.className)
        .update({
          status: "overdue",
          updated_at: new Date().toISOString()
        })
        .lt("due_date", today)
        .in("status", ["draft", "sent"])
        .not("due_date", "is", null)
        .select();

      if (error) {
        console.error("Error updating overdue invoices:", error);
        return { success: false, error: error.message, count: 0 };
      }

      return {
        success: true,
        count: data?.length || 0,
        updatedInvoices: data
      };
    } catch (error: any) {
      console.error("Error in updateOverdueInvoices:", error);
      return { success: false, error: error.message, count: 0 };
    }
  }

  // Check if a specific invoice is overdue (computed check)
  public isInvoiceOverdue(invoice: InvoiceSupabase): boolean {
    if (!invoice.due_date) return false;
    if (invoice.status === "paid" || invoice.status === "cancelled") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.due_date);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  }

  // Create invoice from quotation
  public async createFromQuotation(quotationId: number, invoiceNumber: string) {
    try {
      // Get quotation data
      const { data: quotation } = await supabase
        .from("quotations")
        .select(
          `
          id, quotation_number, customer_id, total, note,
          quotation_items ( item_id, quantity, unit_price )
        `,
        )
        .eq("id", quotationId)
        .single();

      if (!quotation) return null;

      // Create invoice
      const invoice: InvoiceSupabase = {
        invoice_number: invoiceNumber,
        customer_id: quotation.customer_id,
        quotation_id: quotation.id,
        total: quotation.total,
        status: "draft",
        invoice_date: new Date(),
        note: quotation.note,
      };

      const createdInvoice = await this.create(invoice);
      if (!createdInvoice) return null;

      // Copy items from quotation — sequential, preserving order
      if (quotation.quotation_items && quotation.quotation_items.length > 0) {
        for (let i = 0; i < quotation.quotation_items.length; i++) {
          const item = quotation.quotation_items[i];
          await this.addItem({
            invoice_id: createdInvoice.id,
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            sort_order: i,
          });
        }
      }

      // Update quotation status
      await supabase
        .from("quotations")
        .update({ status: "converted" })
        .eq("id", quotationId);

      return createdInvoice;
    } catch (error) {
      console.error("Error creating invoice from quotation:", error);
      return null;
    }
  }

  // Add these methods to your existing InvoicesRepository class

  /**
   * Create invoice with immediate stock reduction
   */
  public async createWithStockReduction(
    invoice: InvoiceSupabase,
    items: Array<{
      item_id: number;
      quantity: number;
      warehouse_id?: number;
      unit_price: number; // ADD this
      sort_order?: number;
    }>,
  ) {
    try {
      // 1. Create invoice first
      const createdInvoice = await this.create(invoice);
      if (!createdInvoice) {
        return {
          success: false,
          error: "Failed to create invoice",
        };
      }

      // 2. Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || "system";

      // 3. Reduce stock for each item AND save items with warehouse_id
      const stocksRepo = new StocksRepository();
      const reductionResults = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const warehouseId = item.warehouse_id || 1;

        // Save invoice item WITH warehouse_id and unit_price
        // sort_order preserves the order items were chosen in
        await this.addItem({
          invoice_id: createdInvoice.id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price || 0, // Use actual unit_price
          warehouse_id: warehouseId,
          sort_order: item.sort_order ?? i,
        });

        // Reduce stock
        const reduceResult = await stocksRepo.reduceStockForInvoice(
          item.item_id,
          warehouseId,
          item.quantity,
          createdInvoice.id,
          userId,
        );

        reductionResults.push({
          itemId: item.item_id,
          warehouseId,
          success: reduceResult.success,
          error: reduceResult.error,
          newQuantity: reduceResult.newQuantity,
        });
      }

      return {
        success: true,
        invoice: createdInvoice,
        stockReductions: reductionResults,
      };
    } catch (error: any) {
      console.error("Error creating invoice with stock reduction:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel invoice and restore stock
   */
  public async cancelInvoice(id: number) {
    try {
      // 1. Get invoice details (for invoice number in notes)
      const { data: invoiceData, error: invoiceError } = await supabase
        .from(this.className)
        .select("invoice_number")
        .eq("id", id)
        .limit(1);

      if (invoiceError || !invoiceData || invoiceData.length === 0) {
        return {
          success: false,
          error: "Failed to fetch invoice details",
        };
      }

      const invoiceNumber = invoiceData[0].invoice_number;

      // 2. Get invoice items
      const itemsResult = await this.getItems(id);
      if (!itemsResult?.data) {
        return {
          success: false,
          error: "Failed to fetch invoice items",
        };
      }

      // 3. Restore stock for each item using the correct warehouse_id
      const stocksRepo = new StocksRepository();
      const restoreResults = [];

      for (const item of itemsResult.data) {
        // Use the warehouse_id from the invoice item, fallback to 1 if not set
        const warehouseId = item.warehouse_id || 1;
        
        // Pass notes with invoice number for audit trail
        const restoreResult = await stocksRepo.restoreStockFromInvoice(
          item.item_id,
          warehouseId,
          item.quantity,
          `Stock restored from cancelled invoice #${invoiceNumber}`,
        );

        restoreResults.push({
          itemId: item.item_id,
          warehouseId: warehouseId,
          ...restoreResult,
        });
      }

      // 4. Update invoice status
      const { error: statusError } = await supabase
        .from(this.className)
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (statusError) {
        return {
          success: false,
          error: `Failed to update invoice status: ${statusError.message}`,
        };
      }

      return {
        success: true,
        restoredItems: itemsResult.data.length,
        results: restoreResults,
      };
    } catch (error: any) {
      console.error("Error cancelling invoice:", error);
      return { success: false, error: error.message };
    }
  }
}

export default InvoicesRepository;
