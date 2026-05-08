export interface ValuesFilterQuotations {
  quotation_number?: string;
  customer_name?: string;
  minimumTotal?: string;
  maximumTotal?: string;
  status?: string;
  valid_until_from?: string;
  valid_until_to?: string;
  created_at_from?: string;
  created_at_to?: string;
  item_name?: string;
  item_code?: string;
}

export interface ValuesFilterInvoices {
  invoice_number?: string;
  customer_name?: string;
  quotation_number?: string;
  delivery_status?: string;
  minimumTotal?: string;
  maximumTotal?: string;
  status?: string;
  invoice_date_from?: string;
  invoice_date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  created_at_from?: string;
  created_at_to?: string;
  item_name?: string;
  item_code?: string;
}

// types/quotation.ts
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?:string;
  address?: string;
  company?: string;
  abn?: string;
  post_code?: string;
  suburb?: string;
  state?: string;
}

export interface Item {
  id: number;
  name: string;
  itemCode?: string;
  description?: string;
  unit_price: number;
  quantity?: number;
}

export interface QuotationItem {
  id: number;
  quotation_id: number;
  item_id: number;
  items?: Item;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
  warehouse_id?: number;
}

export interface Quotation {
  id: number;
  quotation_number: string;
  customer_id: number;
  customer?: Customer;
  customers?: Customer;
  status:
    | "draft"
    | "sent"
    | "accepted"
    | "converted"
    | "cancelled"
    | "approved";
  total: number;
  discount?: number;
  discount_type?: "percentage" | "fixed";
  subtotal?: number;
  tax?: number;
  tax_rate?: number;
  created_at: string;
  updated_at?: string;
  reference?: string;
  note?: string;
  terms?: string;
  quotation_items?: QuotationItem[];
  // Address snapshot fields - saved with each quotation
  address?: string;
  suburb?: string;
  state?: string;
  post_code?: string;
  valid_until?: string | Date;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_id: number;
  items?: Item;
  quantity: number;
  unit_price: number;
  total_price?: number;
  warehouse_id?: number;
  gst?: boolean;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: Customer;
  customers?: Customer;
  quotation_id?: number | null;
  quotations?: Quotation;
  status: "draft" | "sent" | "paid" | "cancelled" | "overdue";
  delivery_status?: "pending" | "packed" | "shipped" | "delivered" | "returned" | "pick_up";
  total: number;
  discount?: number;
  discount_type?: "percentage" | "fixed";
  invoice_date: string | Date;
  due_date?: string | Date;
  note?: string;
  created_at: string;
  updated_at?: string;
  // Address snapshot fields - saved with each invoice
  address?: string;
  suburb?: string;
  state?: string;
  post_code?: string;
  payment_method?: string;
  payment_date?: string | Date;
  invoice_items?: InvoiceItem[];
}

export interface PDFGenerationResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

export interface PDFViewerProps {
  open: boolean;
  onClose: () => void;
  quotationData: Quotation | null;
}

export interface StyleSheet {
  [key: string]: React.CSSProperties;
}
