import { useState, useEffect, useCallback } from "react";
import supabase from "utils/supabase";

export interface DashboardFilters {
  timeRange: "" | "today" | "week" | "month" | "quarter" | "year" | "custom";
  startDate?: string;
  endDate?: string;
  warehouse?: number;
  itemCategory?: string;
  customer?: number;
  status?: string;
}

export interface DashboardMetrics {
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

export interface TimeSeriesData {
  date: string;
  invoices: number;
  quotations: number;
  sales: number;
}

export interface StockMovement {
  itemId: number;
  itemName: string;
  itemCode: string;
  warehouseName: string;
  quantity: number;
  movementType: "in" | "out";
  referenceNumber: string;
  referenceType: "quotation" | "invoice";
  date: string;
}

const useDashboard = () => {
  const [filters, setFilters] = useState<DashboardFilters>({
    timeRange: "",
    startDate: undefined,
    endDate: undefined,
  });

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // Helper functions for dates
  function getStartOfMonth(): string {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  }

  function getEndOfMonth(): string {
    const date = new Date();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDay.toISOString().split("T")[0];
  }

  function getStartOfWeek(): string {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split("T")[0];
  }

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };

      // Auto-set date ranges based on timeRange
      if (newFilters.timeRange !== undefined) {
        const today = new Date();
        let startDate: string | undefined, endDate: string | undefined;

        switch (updated.timeRange) {
          case "":
            // All time - no date filtering
            startDate = undefined;
            endDate = undefined;
            break;
          case "today":
            startDate = today.toISOString().split("T")[0];
            endDate = startDate;
            break;
          case "week":
            startDate = getStartOfWeek();
            endDate = new Date().toISOString().split("T")[0];
            break;
          case "month":
            startDate = getStartOfMonth();
            endDate = getEndOfMonth();
            break;
          case "quarter":
            const quarter = Math.floor(today.getMonth() / 3);
            const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
            const quarterEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            startDate = quarterStart.toISOString().split("T")[0];
            endDate = quarterEnd.toISOString().split("T")[0];
            break;
          case "year":
            startDate = `${today.getFullYear()}-01-01`;
            endDate = `${today.getFullYear()}-12-31`;
            break;
          default:
            startDate = updated.startDate;
            endDate = updated.endDate;
        }

        updated.startDate = startDate;
        updated.endDate = endDate;
      }

      return updated;
    });
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Only calculate dates if we have a time range selected
      const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
      const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

      // Fetch all data in parallel
      const [
        totalSales,
        totalQuotations,
        totalInvoices,
        totalCustomers,
        topSellingItems,
        lowStockItems,
        monthlySales,
        weeklyTrends,
        customerMetrics,
        stockMetrics,
        timeSeries,
        movements,
      ] = await Promise.all([
        fetchTotalSales(startDate, endDate),
        fetchTotalQuotations(startDate, endDate),
        fetchTotalInvoices(startDate, endDate),
        fetchTotalCustomers(startDate, endDate),
        fetchTopSellingItems(startDate, endDate, filters.warehouse),
        fetchLowStockItems(filters.warehouse),
        fetchMonthlySales(startDate, endDate),
        fetchWeeklyTrends(startDate, endDate),
        fetchCustomerMetrics(startDate, endDate),
        fetchStockMetrics(filters.warehouse),
        fetchTimeSeriesData(startDate, endDate),
        fetchStockMovements(startDate, endDate, filters.warehouse),
      ]);

      setMetrics({
        totalSales,
        totalQuotations,
        totalInvoices,
        totalCustomers,
        topSellingItems,
        lowStockItems,
        monthlySales,
        weeklyTrends,
        customerMetrics,
        stockMetrics,
      });

      setTimeSeriesData(timeSeries);
      setStockMovements(movements);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Data fetching functions
  const fetchTotalSales = async (
    startDate?: Date,
    endDate?: Date
  ): Promise<number> => {
    let query = supabase
      .from("invoices")
      .select("total, status")

    if (startDate && endDate) {
      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  };

  const fetchTotalQuotations = async (
    startDate?: Date,
    endDate?: Date
  ): Promise<number> => {
    let query = supabase
      .from("quotations")
      .select("*", { count: "exact", head: true });

    if (startDate && endDate) {
      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  };

  const fetchTotalInvoices = async (
    startDate?: Date,
    endDate?: Date
  ): Promise<number> => {
    let query = supabase
      .from("invoices")
      .select("*", { count: "exact", head: true });

    if (startDate && endDate) {
      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  };

  const fetchTotalCustomers = async (
    startDate?: Date,
    endDate?: Date
  ): Promise<number> => {
    let query = supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    if (startDate && endDate) {
      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { count, error } = await query;
    if (error) throw error;

    return count || 0;
  };

  const fetchTopSellingItems = async (
    startDate?: Date,
    endDate?: Date,
    warehouse?: number
  ) => {
    let query = supabase
      .from("invoice_items")
      .select(
        `
        quantity,
        unit_price,
        items (id, name, itemCode),
        invoices!inner (
          created_at,
          status
        )
      `
      )
      .eq("invoices.status", "paid");

    if (startDate && endDate) {
      query = query
        .gte("invoices.created_at", startDate.toISOString())
        .lte("invoices.created_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by item
    const itemMap = new Map();

    data.forEach((item: any) => {
      const existing = itemMap.get(item.items.id) || {
        id: item.items.id,
        name: item.items.name,
        itemCode: item.items.itemCode,
        quantitySold: 0,
        revenue: 0,
      };

      existing.quantitySold += item.quantity;
      existing.revenue += item.quantity * item.unit_price;
      itemMap.set(item.items.id, existing);
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);
  };

  const fetchLowStockItems = async (warehouse?: number) => {
    let query = supabase
      .from("stocks")
      .select(
        `
        quantity,
        reserved,
        items (id, name, itemCode)
      `
      )
      .lt("quantity", 10); // Define low stock threshold

    if (warehouse) {
      query = query.eq("warehouse", warehouse);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data
      .map((stock: any) => ({
        id: stock.items.id,
        name: stock.items.name,
        itemCode: stock.items.itemCode,
        quantity: parseFloat(stock.quantity) || 0,
        reserved: parseFloat(stock.reserved) || 0,
        available:
          (parseFloat(stock.quantity) || 0) - (parseFloat(stock.reserved) || 0),
      }))
      .sort((a, b) => a.available - b.available)
      .slice(0, 10);
  };

  const fetchMonthlySales = async (startDate?: Date, endDate?: Date) => {
    let invoicesQuery = supabase
      .from("invoices")
      .select("total, created_at, status")
      .eq("status", "paid");

    let quotationsQuery = supabase
      .from("quotations")
      .select("total, created_at");

    if (startDate && endDate) {
      invoicesQuery = invoicesQuery
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
      quotationsQuery = quotationsQuery
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const [
      { data: invoices, error: invoicesError },
      { data: quotations, error: quotationsError }
    ] = await Promise.all([
      invoicesQuery,
      quotationsQuery
    ]);

    if (invoicesError || quotationsError) {
      throw invoicesError || quotationsError;
    }

    // Group by month
    const monthMap = new Map<
      string,
      {
        month: string;
        sales: number;
        quotations: number;
        invoices: number;
      }
    >();

    // Process invoices
    invoices.forEach((invoice) => {
      const date = new Date(invoice.created_at);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      const monthName = date.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });

      let monthData = monthMap.get(monthKey);
      if (!monthData) {
        monthData = {
          month: monthName,
          sales: 0,
          quotations: 0,
          invoices: 0,
        };
        monthMap.set(monthKey, monthData);
      }

      monthData.sales += invoice.total || 0;
      monthData.invoices += 1;
    });

    // Process quotations
    quotations.forEach((quotation) => {
      const date = new Date(quotation.created_at);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;

      let monthData = monthMap.get(monthKey);
      if (!monthData) {
        const monthName = date.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        monthData = {
          month: monthName,
          sales: 0,
          quotations: 0,
          invoices: 0,
        };
        monthMap.set(monthKey, monthData);
      }

      monthData.quotations += 1;
    });

    // Convert to array and sort
    return Array.from(monthMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  };

  const fetchWeeklyTrends = async (startDate?: Date, endDate?: Date) => {
    let invoicesQuery = supabase
      .from("invoices")
      .select("total, created_at, status")
      .eq("status", "paid");

    if (startDate && endDate) {
      invoicesQuery = invoicesQuery
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { data: invoices, error: invoicesError } = await invoicesQuery;

    if (invoicesError) throw invoicesError;

    // Group by week
    const weekMap = new Map<
      string,
      {
        week: string;
        sales: number;
        invoices: number;
      }
    >();

    invoices.forEach((invoice) => {
      const date = new Date(invoice.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      const weekLabel = `Week ${getWeekNumber(date)}`;

      let weekData = weekMap.get(weekKey);
      if (!weekData) {
        weekData = {
          week: weekLabel,
          sales: 0,
          invoices: 0,
        };
        weekMap.set(weekKey, weekData);
      }

      weekData.sales += invoice.total || 0;
      weekData.invoices += 1;
    });

    return Array.from(weekMap.values()).sort((a, b) =>
      a.week.localeCompare(b.week)
    );

    function getWeekNumber(d: Date): number {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
      const week1 = new Date(date.getFullYear(), 0, 4);
      return (
        1 +
        Math.round(
          ((date.getTime() - week1.getTime()) / 86400000 -
            3 +
            ((week1.getDay() + 6) % 7)) /
            7
        )
      );
    }
  };

  const fetchCustomerMetrics = async (startDate?: Date, endDate?: Date) => {
    // Get top customers
    let topCustomersQuery = supabase
      .from("invoices")
      .select(
        `
        total,
        status,
        customers!inner (id, name)
      `
      )
      .eq("status", "paid");

    if (startDate && endDate) {
      topCustomersQuery = topCustomersQuery
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { data: topCustomersData, error: topCustomersError } = await topCustomersQuery;

    if (topCustomersError) throw topCustomersError;

    // Aggregate by customer
    const customerMap = new Map<
      number,
      {
        id: number;
        name: string;
        totalSpent: number;
        invoiceCount: number;
      }
    >();

    topCustomersData.forEach((invoice: any) => {
      const existing = customerMap.get(invoice.customers.id) || {
        id: invoice.customers.id,
        name: invoice.customers.name,
        totalSpent: 0,
        invoiceCount: 0,
      };

      existing.totalSpent += invoice.total || 0;
      existing.invoiceCount += 1;
      customerMap.set(invoice.customers.id, existing);
    });

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Get new customers count
    let newCustomersQuery = supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    if (startDate && endDate) {
      newCustomersQuery = newCustomersQuery
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { count: newCustomers, error: newCustomersError } = await newCustomersQuery;

    if (newCustomersError) throw newCustomersError;

    return {
      topCustomers,
      newCustomers: newCustomers || 0,
    };
  };

  const fetchStockMetrics = async (warehouse?: number) => {
    let query = supabase.from("stocks").select(`
        quantity,
        reserved,
        items!inner (purchasePrice)
      `);

    if (warehouse) {
      query = query.eq("warehouse", warehouse);
    }

    const { data, error } = await query;

    if (error) throw error;

    let totalItems = 0;
    let totalValue = 0;
    let outOfStock = 0;
    let lowStock = 0;

    data.forEach((stock: any) => {
      const quantity = parseFloat(stock.quantity) || 0;
      const reserved = parseFloat(stock.reserved) || 0;
      const available = quantity - reserved;
      const purchasePrice = stock.items?.purchasePrice || 0;

      totalItems += quantity;
      totalValue += quantity * purchasePrice;

      if (available <= 0) {
        outOfStock++;
      } else if (available < 10) {
        // Low stock threshold
        lowStock++;
      }
    });

    return {
      totalItems,
      totalValue,
      outOfStock,
      lowStock,
    };
  };

  const fetchTimeSeriesData = async (
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeSeriesData[]> => {
    let invoicesQuery = supabase
      .from("invoices")
      .select("total, created_at, status");

    let quotationsQuery = supabase
      .from("quotations")
      .select("total, created_at");

    if (startDate && endDate) {
      invoicesQuery = invoicesQuery
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
      quotationsQuery = quotationsQuery
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const [
      { data: invoices, error: invoicesError },
      { data: quotations, error: quotationsError }
    ] = await Promise.all([
      invoicesQuery,
      quotationsQuery
    ]);

    if (invoicesError || quotationsError) {
      throw invoicesError || quotationsError;
    }

    // Create a map for each date
    const dateMap = new Map<string, TimeSeriesData>();

    // Process invoices
    invoices.forEach((invoice) => {
      const date = new Date(invoice.created_at).toISOString().split("T")[0];
      let dayData = dateMap.get(date);
      if (!dayData) {
        dayData = {
          date,
          invoices: 0,
          quotations: 0,
          sales: 0,
        };
        dateMap.set(date, dayData);
      }

      dayData.invoices += 1;
      if (invoice.status === "paid") {
        dayData.sales += invoice.total || 0;
      }
    });

    // Process quotations
    quotations.forEach((quotation) => {
      const date = new Date(quotation.created_at).toISOString().split("T")[0];
      let dayData = dateMap.get(date);
      if (!dayData) {
        dayData = {
          date,
          invoices: 0,
          quotations: 0,
          sales: 0,
        };
        dateMap.set(date, dayData);
      }

      dayData.quotations += 1;
    });

    // Convert to array and sort
    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  };

  const fetchStockMovements = async (
    startDate?: Date,
    endDate?: Date,
    warehouse?: number
  ): Promise<StockMovement[]> => {
    // Get stock movements from invoices
    let invoiceMovementsQuery = supabase
      .from("invoice_items")
      .select(
        `
        quantity,
        unit_price,
        items!inner (id, name, itemCode),
        invoices!inner (
          invoice_number,
          created_at,
          status
        )
      `
      );

    // Get stock movements from quotations
    let quotationMovementsQuery = supabase
      .from("quotation_items")
      .select(
        `
        quantity,
        unit_price,
        items!inner (id, name, itemCode),
        quotations!inner (
          quotation_number,
          created_at,
          status
        )
      `
      );

    if (startDate && endDate) {
      invoiceMovementsQuery = invoiceMovementsQuery
        .gte("invoices.created_at", startDate.toISOString())
        .lte("invoices.created_at", endDate.toISOString());
      quotationMovementsQuery = quotationMovementsQuery
        .gte("quotations.created_at", startDate.toISOString())
        .lte("quotations.created_at", endDate.toISOString());
    }

    const [
      { data: invoiceMovements, error: invoiceError },
      { data: quotationMovements, error: quotationError }
    ] = await Promise.all([
      invoiceMovementsQuery,
      quotationMovementsQuery
    ]);

    if (invoiceError || quotationError) {
      throw invoiceError || quotationError;
    }

    const movements: StockMovement[] = [];

    // Add invoice movements (stock out)
    invoiceMovements?.forEach((item: any) => {
      movements.push({
        itemId: item.items.id,
        itemName: item.items.name,
        itemCode: item.items.itemCode,
        warehouseName: "Main Warehouse",
        quantity: item.quantity,
        movementType: "out",
        referenceNumber: item.invoices.invoice_number,
        referenceType: "invoice",
        date: item.invoices.created_at,
      });
    });

    // Add quotation movements (stock reserved)
    quotationMovements?.forEach((item: any) => {
      if (item.quotations.status !== "cancelled") {
        movements.push({
          itemId: item.items.id,
          itemName: item.items.name,
          itemCode: item.items.itemCode,
          warehouseName: "Main Warehouse",
          quantity: item.quantity,
          movementType: "out",
          referenceNumber: item.quotations.quotation_number,
          referenceType: "quotation",
          date: item.quotations.created_at,
        });
      }
    });

    // Sort by date descending
    return movements
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50); // Limit to 50 most recent movements
  };

  // Export functions
  const exportMonthlyReport = async () => {
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;
    
    const timeRangeLabel = filters.timeRange === "" 
      ? "All time" 
      : `${filters.startDate || ''} to ${filters.endDate || ''}`;

    const [
      salesData,
      invoiceData,
      quotationData,
      stockMovementsData,
      topItemsData,
    ] = await Promise.all([
      fetchTimeSeriesData(startDate, endDate),
      supabase
        .from("invoices")
        .select(
          `
          invoice_number,
          total,
          status,
          invoice_date,
          customers (name),
          invoice_items (
            quantity,
            unit_price,
            items (name, itemCode)
          )
        `
        )
        .gte("created_at", startDate ? startDate.toISOString() : "1970-01-01")
        .lte("created_at", endDate ? endDate.toISOString() : new Date().toISOString()),
      supabase
        .from("quotations")
        .select(
          `
          quotation_number,
          total,
          status,
          valid_until,
          customers (name),
          quotation_items (
            quantity,
            unit_price,
            items (name, itemCode)
          )
        `
        )
        .gte("created_at", startDate ? startDate.toISOString() : "1970-01-01")
        .lte("created_at", endDate ? endDate.toISOString() : new Date().toISOString()),
      fetchStockMovements(startDate, endDate, filters.warehouse),
      fetchTopSellingItems(startDate, endDate, filters.warehouse),
    ]);

    return {
      period: timeRangeLabel,
      summary: {
        totalSales: metrics?.totalSales || 0,
        totalInvoices: metrics?.totalInvoices || 0,
        totalQuotations: metrics?.totalQuotations || 0,
        totalCustomers: metrics?.totalCustomers || 0,
      },
      timeSeries: salesData,
      invoices: invoiceData.data || [],
      quotations: quotationData.data || [],
      stockMovements: stockMovementsData,
      topSellingItems: topItemsData,
      generatedAt: new Date().toISOString(),
    };
  };

  // Refresh data
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    metrics,
    timeSeriesData,
    stockMovements,
    filters,
    loading,
    error,
    updateFilters,
    fetchDashboardData,
    exportMonthlyReport,
  };
};

export default useDashboard;