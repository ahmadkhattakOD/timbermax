// types/dashboard.ts
export interface DashboardData {
  totalSales: number;
  totalQuotations: number;
  totalInvoices: number;
  totalCustomers: number;
  topSellingItems: Array<{
    id: number;
    name: string;
    itemCode: string;
    quantitySold: number;
    revenue: number;
  }>;
  lowStockItems: Array<{
    id: number;
    name: string;
    itemCode: string;
    quantity: number;
    reserved: number;
    available: number;
  }>;
  monthlySales: Array<{
    month: string;
    sales: number;
    quotations: number;
    invoices: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    sales: number;
    invoices: number;
  }>;
  customerMetrics: {
    topCustomers: Array<{
      id: number;
      name: string;
      totalSpent: number;
      invoiceCount: number;
    }>;
    newCustomers: number;
  };
  stockMetrics: {
    totalItems: number;
    totalValue: number;
    outOfStock: number;
    lowStock: number;
  };
}