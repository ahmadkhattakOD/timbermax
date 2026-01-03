export interface ValuesFilterQuotations {
  quotation_number: string;
  customer_name: string;
  minimumTotal: string;
  maximumTotal: string;
  status: string;
  valid_until_from?: string;
  valid_until_to?: string;
  created_at_from: string;
  created_at_to: string;
  item_name: string;
  item_code: string;
}

export interface ValuesFilterInvoices {
  invoice_number: string;
  customer_name: string;
  quotation_number: string;
  delivery_status: string;
  minimumTotal: string;
  maximumTotal: string;
  status: string;
  invoice_date_from: string;
  invoice_date_to: string;
  created_at_from: string;
  created_at_to: string;
  item_name: string;
  item_code: string;
}

// types/quotation.ts
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
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
  subtotal?: number;
  tax?: number;
  tax_rate?: number;
  created_at: string;
  updated_at?: string;
  reference?: string;
  note?: string;
  terms?: string;
  quotation_items?: QuotationItem[];
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
