import { useState, useEffect, useCallback } from "react";
import supabase from "utils/supabase";
import { roundAmount } from "utils/helpers";

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
    totalItemCount: number; // Count of unique items, not sum of quantities
    outOfStock: number; // Items with available <= 0 (includes negative stock)
    lowStock: number; // Items with 0 < available <= 10
    inStock: number; // Items with available > 10
  };
}

export interface TimeSeriesData {
  date: string;
  invoices: number;
  quotations: number;
  sales: number;
}

export interface StockMovement {
  id?: number;
  itemId: number;
  itemName: string;
  itemCode: string;
  warehouseName: string;
  quantity: number;
  quantityChange: number;
  movementType: "in" | "out" | "adjustment" | "reserve" | "release" | "transfer";
  referenceNumber?: string;
  referenceType?: "quotation" | "invoice" | "manual" | "system";
  date: string;
  notes?: string;
  userName?: string;
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

  // Helper function to get date range
  const getDateRange = useCallback(() => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (filters.timeRange === "" || !filters.timeRange) {
      return { startDate: undefined, endDate: undefined };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filters.timeRange) {
      case "today":
        // Today's date
        const todayStr = today.toISOString().split("T")[0];
        startDate = todayStr;
        endDate = todayStr;
        break;

      case "week":
        // Get Monday of this week
        const weekStart = new Date(today);
        // Sunday = 0, Monday = 1, ..., Saturday = 6
        const dayOfWeek = weekStart.getDay();
        // Calculate difference to Monday
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(today.getDate() - diffToMonday);

        startDate = weekStart.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;

      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        startDate = monthStart.toISOString().split("T")[0];
        endDate = monthEnd.toISOString().split("T")[0];
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

      case "custom":
        startDate = filters.startDate;
        endDate = filters.endDate;
        break;
    }

    console.log("Date range calculated:", {
      timeRange: filters.timeRange,
      startDate,
      endDate,
    });
    return { startDate, endDate };
  }, [filters.timeRange, filters.startDate, filters.endDate]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };

      // Auto-set date ranges based on timeRange (except custom)
      if (
        newFilters.timeRange !== undefined &&
        newFilters.timeRange !== "custom"
      ) {
        const { startDate, endDate } = getDateRange();
        updated.startDate = startDate;
        updated.endDate = endDate;
      }

      console.log("Filters updated:", updated);
      return updated;
    });
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange();

      console.log("Fetching data with date range:", {
        timeRange: filters.timeRange,
        startDate,
        endDate,
      });

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
        fetchAllStockMovements(startDate, endDate, filters.warehouse),
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

      console.log("Data fetched successfully");
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const reason =
        (err as any)?.message || (err as any)?.details || String(err);
      setError(`Failed to load dashboard data: ${reason}`);
    } finally {
      setLoading(false);
    }
  }, [filters, getDateRange]);

  // Data fetching functions with proper date filtering
  const fetchTotalSales = async (
    startDate?: string,
    endDate?: string
  ): Promise<number> => {
    console.log("Fetching total sales with:", { startDate, endDate });

    let query = supabase
      .from("invoices")
      .select("total, created_at, status")
      .eq("status", "paid");

    if (startDate && endDate) {
      query = query
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching total sales:", error);
      throw error;
    }

    const total = roundAmount(
      data?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0
    );
    console.log("Total sales result:", total, "from", data?.length, "invoices");
    return total;
  };

  const fetchTotalQuotations = async (
    startDate?: string,
    endDate?: string
  ): Promise<number> => {
    console.log("Fetching total quotations with:", { startDate, endDate });

    let query = supabase
      .from("quotations")
      .select("*", { count: "exact", head: true });

    if (startDate && endDate) {
      query = query
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error fetching total quotations:", error);
      throw error;
    }

    console.log("Total quotations result:", count || 0);
    return count || 0;
  };

  const fetchTotalInvoices = async (
    startDate?: string,
    endDate?: string
  ): Promise<number> => {
    console.log("Fetching total invoices with:", { startDate, endDate });

    let query = supabase
      .from("invoices")
      .select("*", { count: "exact", head: true });

    if (startDate && endDate) {
      query = query
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error fetching total invoices:", error);
      throw error;
    }

    console.log("Total invoices result:", count || 0);
    return count || 0;
  };

  const fetchTotalCustomers = async (
    startDate?: string,
    endDate?: string
  ): Promise<number> => {
    console.log("Fetching total customers with:", { startDate, endDate });

    let query = supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    if (startDate && endDate) {
      query = query
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    const { count, error } = await query;
    if (error) {
      console.error("Error fetching total customers:", error);
      throw error;
    }

    console.log("Total customers result:", count || 0);
    return count || 0;
  };

  const fetchTopSellingItems = async (
    startDate?: string,
    endDate?: string,
    warehouse?: number
  ) => {
    console.log("Fetching top selling items with:", {
      startDate,
      endDate,
      warehouse,
    });

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
        .gte("invoices.created_at", `${startDate}T00:00:00`)
        .lte("invoices.created_at", `${endDate}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching top selling items:", error);
      throw error;
    }

    // Aggregate by item
    const itemMap = new Map();

    data?.forEach((item: any) => {
      // Skip rows whose item has been deleted (items relation is null)
      if (!item.items) return;

      const existing = itemMap.get(item.items.id) || {
        id: item.items.id,
        name: item.items.name,
        itemCode: item.items.itemCode,
        quantitySold: 0,
        revenue: 0,
      };

      existing.quantitySold += item.quantity || 0;
      existing.revenue += (item.quantity || 0) * (item.unit_price || 0);
      itemMap.set(item.items.id, existing);
    });

    const result = Array.from(itemMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10)
      .map((item) => ({ ...item, revenue: roundAmount(item.revenue) }));

    console.log("Top selling items result:", result.length, "items");
    return result;
  };

  const fetchLowStockItems = async (warehouse?: number) => {
    console.log("Fetching low stock items with:", { warehouse });

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

    if (error) {
      console.error("Error fetching low stock items:", error);
      throw error;
    }

    const result =
      data
        ?.filter((stock: any) => stock.items)
        .map((stock: any) => ({
          id: stock.items.id,
          name: stock.items.name,
          itemCode: stock.items.itemCode,
          quantity: parseFloat(stock.quantity) || 0,
          reserved: parseFloat(stock.reserved) || 0,
          available:
            (parseFloat(stock.quantity) || 0) -
            (parseFloat(stock.reserved) || 0),
        }))
        .sort((a, b) => a.available - b.available)
        .slice(0, 10) || [];

    console.log("Low stock items result:", result.length, "items");
    return result;
  };

  const fetchMonthlySales = async (startDate?: string, endDate?: string) => {
    console.log("Fetching monthly sales with:", { startDate, endDate });

    let invoicesQuery = supabase
      .from("invoices")
      .select("total, created_at, status")
      .eq("status", "paid");

    let quotationsQuery = supabase
      .from("quotations")
      .select("total, created_at");

    if (startDate && endDate) {
      invoicesQuery = invoicesQuery
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
      quotationsQuery = quotationsQuery
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    const [
      { data: invoices, error: invoicesError },
      { data: quotations, error: quotationsError },
    ] = await Promise.all([invoicesQuery, quotationsQuery]);

    if (invoicesError || quotationsError) {
      console.error(
        "Error fetching monthly sales:",
        invoicesError || quotationsError
      );
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
    invoices?.forEach((invoice) => {
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
    quotations?.forEach((quotation) => {
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

    const result = Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((month) => ({ ...month, sales: roundAmount(month.sales) }));

    console.log("Monthly sales result:", result.length, "months");
    return result;
  };

  const fetchWeeklyTrends = async (startDate?: string, endDate?: string) => {
    console.log("Fetching weekly trends with:", { startDate, endDate });

    let invoicesQuery = supabase
      .from("invoices")
      .select("total, created_at, status")
      .eq("status", "paid");

    if (startDate && endDate) {
      invoicesQuery = invoicesQuery
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    const { data: invoices, error: invoicesError } = await invoicesQuery;

    if (invoicesError) {
      console.error("Error fetching weekly trends:", invoicesError);
      throw invoicesError;
    }

    // Group by week
    const weekMap = new Map<
      string,
      {
        week: string;
        sales: number;
        invoices: number;
      }
    >();

    invoices?.forEach((invoice) => {
      const date = new Date(invoice.created_at);
      const weekStart = new Date(date);
      const dayOfWeek = weekStart.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(date.getDate() - diffToMonday);

      const weekKey = weekStart.toISOString().split("T")[0];
      const weekLabel = `Week ${getWeekNumber(date)} (${weekStart.toISOString().split("T")[0]})`;

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

    const result = Array.from(weekMap.values())
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((week) => ({ ...week, sales: roundAmount(week.sales) }));

    console.log("Weekly trends result:", result.length, "weeks");
    return result;

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

  const fetchCustomerMetrics = async (startDate?: string, endDate?: string) => {
    console.log("Fetching customer metrics with:", { startDate, endDate });

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
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    const { data: topCustomersData, error: topCustomersError } =
      await topCustomersQuery;

    if (topCustomersError) {
      console.error("Error fetching top customers:", topCustomersError);
      throw topCustomersError;
    }

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

    topCustomersData?.forEach((invoice: any) => {
      if (!invoice.customers) return;

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
      .slice(0, 5)
      .map((customer) => ({
        ...customer,
        totalSpent: roundAmount(customer.totalSpent),
      }));

    // Get new customers count
    let newCustomersQuery = supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    if (startDate && endDate) {
      newCustomersQuery = newCustomersQuery
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    const { count: newCustomers, error: newCustomersError } =
      await newCustomersQuery;

    if (newCustomersError) {
      console.error("Error fetching new customers:", newCustomersError);
      throw newCustomersError;
    }

    const result = {
      topCustomers,
      newCustomers: newCustomers || 0,
    };

    console.log("Customer metrics result:", result);
    return result;
  };

  const fetchStockMetrics = async (warehouse?: number) => {
    console.log("Fetching stock metrics with:", { warehouse });

    let query = supabase.from("stocks").select(`
        quantity,
        reserved,
        items!inner (purchasePrice, sellPrice)
      `);

    if (warehouse) {
      query = query.eq("warehouse", warehouse);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching stock metrics:", error);
      throw error;
    }

    let totalItems = 0; // Sum of all quantities
    let totalValue = 0;
    let totalItemCount = 0; // Count of unique items
    let outOfStock = 0; // Items with available <= 0 (includes negative stock)
    let lowStock = 0; // Items with 0 < available <= 10
    let inStock = 0; // Items with available > 10

    data?.forEach((stock: any) => {
      const quantity = parseFloat(stock.quantity) || 0;
      const reserved = parseFloat(stock.reserved) || 0;
      const available = quantity - reserved;
      const sellPrice = stock.items?.sellPrice || 0;

      totalItems += quantity;
      totalValue += quantity * sellPrice;
      totalItemCount++; // Count each item record

      if (available <= 0) {
        outOfStock++; // Out of stock (available <= 0, includes negative stock)
      } else if (available <= 10) {
        lowStock++; // Low stock (0 < available <= 10)
      } else {
        inStock++; // In stock (available > 10)
      }
    });

    const result = {
      totalItems: roundAmount(totalItems),
      totalValue: roundAmount(totalValue),
      totalItemCount,
      outOfStock,
      lowStock,
      inStock,
    };

    console.log("Stock metrics result:", result);
    return result;
  };

  const fetchTimeSeriesData = async (
    startDate?: string,
    endDate?: string
  ): Promise<TimeSeriesData[]> => {
    console.log("Fetching time series data with:", { startDate, endDate });

    let invoicesQuery = supabase
      .from("invoices")
      .select("total, created_at, status");

    let quotationsQuery = supabase
      .from("quotations")
      .select("total, created_at");

    if (startDate && endDate) {
      invoicesQuery = invoicesQuery
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
      quotationsQuery = quotationsQuery
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    const [
      { data: invoices, error: invoicesError },
      { data: quotations, error: quotationsError },
    ] = await Promise.all([invoicesQuery, quotationsQuery]);

    if (invoicesError || quotationsError) {
      console.error(
        "Error fetching time series data:",
        invoicesError || quotationsError
      );
      throw invoicesError || quotationsError;
    }

    // Create a map for each date
    const dateMap = new Map<string, TimeSeriesData>();

    // Process invoices
    invoices?.forEach((invoice) => {
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
    quotations?.forEach((quotation) => {
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
    const result = Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => ({ ...day, sales: roundAmount(day.sales) }));

    console.log("Time series data result:", result.length, "days");
    return result;
  };

  const fetchAllStockMovements = async (
    startDate?: string,
    endDate?: string,
    warehouse?: number
  ): Promise<StockMovement[]> => {
    console.log("Fetching all stock movements with:", { startDate, endDate, warehouse });

    let query = supabase
      .from("stock_movements")
      .select(`
        *,
        items:item_id (id, name, itemCode),
        warehouses:warehouse_id (id, name),
        users:user_id (id, full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100); // Limit to 100 most recent movements

    // Apply date filters
    if (startDate && endDate) {
      query = query
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);
    }

    // Apply warehouse filter
    if (warehouse) {
      query = query.eq("warehouse_id", warehouse);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching stock movements:", error);
      throw error;
    }

    const movements: StockMovement[] = (data || []).map((movement: any) => ({
      id: movement.id,
      itemId: movement.items?.id || 0, itemName: movement.items?.name || "Unknown Item",
      itemCode: movement.items?.itemCode || "",
      warehouseName: movement.warehouses?.name || "Unknown Warehouse",
      quantity: movement.quantity_after || 0,
      quantityChange: movement.quantity_change || 0,
      movementType: movement.movement_type,
      referenceNumber: movement.notes?.match(/(?:quotation|invoice) #\w+/i)?.[0] || "",
      referenceType: getReferenceTypeFromNotes(movement.notes),
      date: movement.created_at,
      notes: movement.notes,
      userName: movement.users?.full_name || "System",
    }));

    console.log("All stock movements result:", movements.length, "movements");
    return movements;

    function getReferenceTypeFromNotes(notes?: string): "quotation" | "invoice" | "manual" | "system" {
      if (!notes) return "system";
      if (notes.toLowerCase().includes("quotation")) return "quotation";
      if (notes.toLowerCase().includes("invoice")) return "invoice";
      if (notes.toLowerCase().includes("manual") || notes.toLowerCase().includes("adjusted")) return "manual";
      return "system";
    }
  };

  // Export functions
  const exportMonthlyReport = async () => {
    const { startDate, endDate } = getDateRange();

    const timeRangeLabel =
      filters.timeRange === ""
        ? "All time"
        : `${filters.startDate || ""} to ${filters.endDate || ""}`;

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
        .gte("created_at", startDate ? `${startDate}T00:00:00` : "1970-01-01")
        .lte(
          "created_at",
          endDate ? `${endDate}T23:59:59` : new Date().toISOString()
        ),
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
        .gte("created_at", startDate ? `${startDate}T00:00:00` : "1970-01-01")
        .lte(
          "created_at",
          endDate ? `${endDate}T23:59:59` : new Date().toISOString()
        ),
      fetchAllStockMovements(startDate, endDate, filters.warehouse),
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

  // Refresh data when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [
    filters.timeRange,
    filters.startDate,
    filters.endDate,
    filters.warehouse,
  ]);

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
