import { useState, useEffect, useCallback, useMemo } from "react";
import QuotationsRepository from "utils/repositories/quotationRepo";
import CustomersRepository from "utils/repositories/customersRepository";
import { getDateFormatted } from "utils/helpers";

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
  from: string;
  to: string;
  status: string;
}

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
};

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

export interface QuotationReportSummary {
  count: number;
  grandTotal: number;
  subtotalTotal: number; // sum of item subtotals (ex GST), excl. cancelled
  gstTotal: number; // sum of GST (10% on GST items), excl. cancelled
  approvedTotal: number;
  approvedCount: number;
  pendingTotal: number;
  pendingCount: number;
  convertedTotal: number;
  convertedCount: number;
  cancelledTotal: number;
  cancelledCount: number;
  itemsTotal: number;
  byStatus: Record<string, { count: number; total: number }>;
}

const emptySummary: QuotationReportSummary = {
  count: 0,
  grandTotal: 0,
  subtotalTotal: 0,
  gstTotal: 0,
  approvedTotal: 0,
  approvedCount: 0,
  pendingTotal: 0,
  pendingCount: 0,
  convertedTotal: 0,
  convertedCount: 0,
  cancelledTotal: 0,
  cancelledCount: 0,
  itemsTotal: 0,
  byStatus: {},
};

// Per-quotation GST + ex-GST subtotal, mirroring the quotation PDF (10% on GST items)
const quotationGstBreakdown = (q: any): { subtotal: number; gst: number } => {
  const items = q.quotation_items || [];
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

export function useCustomerQuotationReport(customerId: number) {
  const [customerName, setCustomerName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);

  // Default to All Time so every quotation shows; user can narrow to a month
  const [range, setRange] = useState<ReportRange>({
    preset: "all_time",
    from: "",
    to: "",
    status: "",
  });

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

  const getData = useCallback(async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const quotationsRepo = new QuotationsRepository();
      const filters: any = {
        created_at_from: range.from || undefined,
        // include the whole "to" day (created_at is a timestamp)
        created_at_to: range.to ? `${range.to}T23:59:59.999` : undefined,
        status: range.status || undefined,
      };

      const quotations = await quotationsRepo.getByCustomer(
        customerId,
        "created_at",
        true,
        0,
        9999,
        10000,
        filters,
      );

      if (quotations) {
        const { quotationsData, quotationsError } = quotations;
        if (quotationsData && !quotationsError) {
          setData(quotationsData as any[]);
        } else {
          setData([]);
        }
      }
    } catch (e) {
      console.error("Error fetching report quotations:", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [customerId, range.from, range.to, range.status]);

  useEffect(() => {
    getData();
  }, [getData]);

  const summary: QuotationReportSummary = useMemo(() => {
    if (!data.length) return emptySummary;
    const pendingStatuses = ["draft", "sent"];
    const approvedStatuses = ["approved", "accepted"];
    return data.reduce<QuotationReportSummary>(
      (acc, q) => {
        const total = Number(q.total) || 0;
        const status = q.status || "unknown";
        const itemsCount = q.quotation_items?.length || 0;

        acc.count += 1;
        acc.itemsTotal += itemsCount;

        if (status !== "cancelled") {
          acc.grandTotal += total;
          const { subtotal, gst } = quotationGstBreakdown(q);
          acc.subtotalTotal += subtotal;
          acc.gstTotal += gst;
        }
        if (approvedStatuses.includes(status)) {
          acc.approvedTotal += total;
          acc.approvedCount += 1;
        } else if (pendingStatuses.includes(status)) {
          acc.pendingTotal += total;
          acc.pendingCount += 1;
        } else if (status === "converted") {
          acc.convertedTotal += total;
          acc.convertedCount += 1;
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

  const rangeLabel = useMemo(() => {
    if (!range.from && !range.to) return "All time";
    const from = range.from ? getDateFormatted(range.from) : "start";
    const to = range.to ? getDateFormatted(range.to) : "today";
    return `${from} to ${to}`;
  }, [range.from, range.to]);

  const downloadCsv = () => {
    try {
      let csv = "Quotation Number,Date,Status,Items,Total\n";
      data.forEach((q: any) => {
        csv += `"${q.quotation_number ?? ""}","${getDateFormatted(
          q.created_at,
        )}","${q.status ?? ""}","${q.quotation_items?.length || 0}",${
          Number(q.total) || 0
        }\n`;
      });
      csv += `\nTotal,,,,${summary.grandTotal.toFixed(2)}\n`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_quotations_customer_${customerId}_${
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
