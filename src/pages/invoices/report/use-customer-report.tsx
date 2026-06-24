import { useState, useEffect, useCallback, useMemo } from "react";
import InvoicesRepository from "utils/repositories/invoicesRepository";
import CustomersRepository from "utils/repositories/customersRepository";
import { getDateFormatted } from "utils/helpers";

// Date range presets supported by the report
export type ReportPreset =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "last_year"
  | "all_time"
  | "custom";

export interface ReportRange {
  preset: ReportPreset;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  status: string; // "" = all
}

// Build a YYYY-MM-DD string from a Date (local)
const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Resolve a preset into concrete from/to dates
export const resolvePreset = (
  preset: ReportPreset,
  current?: { from: string; to: string },
): { from: string; to: string } => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case "this_month":
      return {
        from: toISODate(new Date(y, m, 1)),
        to: toISODate(new Date(y, m + 1, 0)),
      };
    case "last_month":
      return {
        from: toISODate(new Date(y, m - 1, 1)),
        to: toISODate(new Date(y, m, 0)),
      };
    case "this_quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return {
        from: toISODate(new Date(y, qStart, 1)),
        to: toISODate(new Date(y, qStart + 3, 0)),
      };
    }
    case "this_year":
      return {
        from: toISODate(new Date(y, 0, 1)),
        to: toISODate(new Date(y, 11, 31)),
      };
    case "last_year":
      return {
        from: toISODate(new Date(y - 1, 0, 1)),
        to: toISODate(new Date(y - 1, 11, 31)),
      };
    case "all_time":
      return { from: "", to: "" };
    case "custom":
    default:
      return { from: current?.from ?? "", to: current?.to ?? "" };
  }
};

export interface ReportSummary {
  count: number;
  grandTotal: number;
  subtotalTotal: number; // sum of item subtotals (ex GST), excl. cancelled
  gstTotal: number; // sum of GST (10% on GST items), excl. cancelled
  paidTotal: number;
  paidCount: number;
  outstandingTotal: number;
  outstandingCount: number;
  cancelledTotal: number;
  cancelledCount: number;
  depositTotal: number;
  itemsTotal: number;
  byStatus: Record<
    string,
    { count: number; total: number }
  >;
}

const emptySummary: ReportSummary = {
  count: 0,
  grandTotal: 0,
  subtotalTotal: 0,
  gstTotal: 0,
  paidTotal: 0,
  paidCount: 0,
  outstandingTotal: 0,
  outstandingCount: 0,
  cancelledTotal: 0,
  cancelledCount: 0,
  depositTotal: 0,
  itemsTotal: 0,
  byStatus: {},
};

// Per-invoice GST + ex-GST subtotal, mirroring the invoice PDF (10% on GST items)
const invoiceGstBreakdown = (inv: any): { subtotal: number; gst: number } => {
  const items = inv.invoice_items || [];
  let subtotal = 0;
  let gst = 0;
  items.forEach((item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const lineSub = qty * unitPrice;
    const hasGst = (item.item_gst ?? item.items?.gst) || false;
    subtotal += lineSub;
    gst += hasGst ? lineSub * 0.1 : 0;
  });
  return { subtotal, gst };
};

export function useCustomerReport(customerId: number) {
  const [customerName, setCustomerName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);

  // Default to All Time so every invoice shows; user can narrow to a month
  const [range, setRange] = useState<ReportRange>({
    preset: "all_time",
    from: "",
    to: "",
    status: "",
  });

  // Fetch customer name once
  useEffect(() => {
    let active = true;
    (async () => {
      if (!customerId) return;
      try {
        const customersRepo = new CustomersRepository();
        const customer = await customersRepo.getSingle(customerId);
        if (active && customer?.customerData) {
          setCustomerName(customer.customerData.name);
        }
      } catch (e) {
        console.error("Error fetching customer:", e);
      }
    })();
    return () => {
      active = false;
    };
  }, [customerId]);

  // Fetch ALL matching invoices for the selected range (no pagination)
  const getData = useCallback(async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const invoicesRepo = new InvoicesRepository();
      const filters: any = {
        invoice_date_from: range.from || undefined,
        // include the whole "to" day even if invoice_date is a timestamp
        invoice_date_to: range.to ? `${range.to}T23:59:59.999` : undefined,
        status: range.status || undefined,
      };

      const invoices = await invoicesRepo.getByCustomer(
        customerId,
        "invoice_date",
        true,
        0,
        9999,
        10000,
        filters,
      );

      if (invoices) {
        const { invoicesData, invoicesError } = invoices;
        if (invoicesData && !invoicesError) {
          setData(invoicesData as any[]);
        } else {
          setData([]);
        }
      }
    } catch (e) {
      console.error("Error fetching report invoices:", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [customerId, range.from, range.to, range.status]);

  useEffect(() => {
    getData();
  }, [getData]);

  // Compute totals from the fetched set
  const summary: ReportSummary = useMemo(() => {
    if (!data.length) return emptySummary;
    const outstandingStatuses = ["sent", "draft", "overdue"];
    return data.reduce<ReportSummary>(
      (acc, inv) => {
        const total = Number(inv.total) || 0;
        const deposit = Number(inv.deposit) || 0;
        const status = inv.status || "unknown";
        const itemsCount = inv.invoice_items?.length || 0;

        acc.count += 1;
        acc.depositTotal += deposit;
        acc.itemsTotal += itemsCount;

        if (status !== "cancelled") {
          acc.grandTotal += total;
          const { subtotal, gst } = invoiceGstBreakdown(inv);
          acc.subtotalTotal += subtotal;
          acc.gstTotal += gst;
        }
        if (status === "paid") {
          acc.paidTotal += total;
          acc.paidCount += 1;
        } else if (outstandingStatuses.includes(status)) {
          acc.outstandingTotal += total;
          acc.outstandingCount += 1;
        } else if (status === "cancelled") {
          acc.cancelledTotal += total;
          acc.cancelledCount += 1;
        }

        if (!acc.byStatus[status]) {
          acc.byStatus[status] = { count: 0, total: 0 };
        }
        acc.byStatus[status].count += 1;
        acc.byStatus[status].total += total;

        return acc;
      },
      { ...emptySummary, byStatus: {} },
    );
  }, [data]);

  const setPreset = (preset: ReportPreset) => {
    setRange((prev) => {
      const resolved = resolvePreset(preset, prev);
      return { ...prev, preset, ...resolved };
    });
  };

  const setCustomFrom = (from: string) =>
    setRange((prev) => ({ ...prev, preset: "custom", from }));

  const setCustomTo = (to: string) =>
    setRange((prev) => ({ ...prev, preset: "custom", to }));

  const setStatus = (status: string) =>
    setRange((prev) => ({ ...prev, status }));

  // Human-readable label for the active range
  const rangeLabel = useMemo(() => {
    if (!range.from && !range.to) return "All time";
    const from = range.from ? getDateFormatted(range.from) : "start";
    const to = range.to ? getDateFormatted(range.to) : "today";
    return `${from} to ${to}`;
  }, [range.from, range.to]);

  // CSV export of the current report
  const downloadCsv = () => {
    try {
      let csv =
        "Invoice Number,Invoice Date,Status,Delivery Status,Items,Deposit,Total\n";
      data.forEach((inv: any) => {
        csv += `"${inv.invoice_number ?? ""}","${getDateFormatted(
          inv.invoice_date,
        )}","${inv.status ?? ""}","${inv.delivery_status ?? "pending"}","${
          inv.invoice_items?.length || 0
        }",${Number(inv.deposit) || 0},${Number(inv.total) || 0}\n`;
      });
      csv += `\nTotals,,,,,${summary.depositTotal.toFixed(
        2,
      )},${summary.grandTotal.toFixed(2)}\n`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_customer_${customerId}_${
        range.from || "all"
      }_${range.to || "all"}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error generating report CSV:", e);
    }
  };

  return {
    customerName,
    loading,
    data,
    range,
    rangeLabel,
    summary,
    setPreset,
    setCustomFrom,
    setCustomTo,
    setStatus,
    downloadCsv,
    refresh: getData,
  };
}
