import {
  Box,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Divider,
} from "@mui/material";
import { ArrowLeft, Download, Printer, FileText } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { getDateFormatted } from "utils/helpers";
import { formatCurrency } from "utils/calculateTotals";
import { generateCustomerQuotationReportPDF } from "utils/quotation-pdf-generator";
import {
  useCustomerQuotationReport,
  ReportPreset,
} from "./use-customer-quotation-report";

const ACCENT = "#9C6A3A";

// Status chip colors — mirrors quotation list theme
const statusColors: Record<string, any> = {
  draft: "warning",
  sent: "info",
  approved: "success",
  accepted: "success",
  converted: "primary",
  cancelled: "error",
};

const presetOptions: { label: string; value: ReportPreset }[] = [
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This Year", value: "this_year" },
  { label: "Last Year", value: "last_year" },
  { label: "All Time", value: "all_time" },
];

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function CustomerQuotationReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customerId = id ? parseInt(id) : 0;

  const {
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
  } = useCustomerQuotationReport(customerId);

  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      await generateCustomerQuotationReportPDF({
        customerName,
        customerId,
        rangeLabel,
        summary,
        rows: data,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <style>{`
        @media print {
          .report-no-print { display: none !important; }
          .report-print-area { box-shadow: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Top controls */}
      <Box
        className="report-no-print"
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate(`/quotations/customer/${id}`)}
        >
          Back to Quotations
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<Download size={18} />}
          onClick={downloadCsv}
          disabled={!data.length}
        >
          Download CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={
            pdfLoading ? <CircularProgress size={16} /> : <FileText size={18} />
          }
          onClick={downloadPdf}
          disabled={!data.length || pdfLoading}
        >
          Download PDF
        </Button>
        <Button
          variant="contained"
          startIcon={<Printer size={18} />}
          onClick={() => window.print()}
          disabled={!data.length}
          sx={{ bgcolor: ACCENT, "&:hover": { bgcolor: "#855631" } }}
        >
          Print
        </Button>
      </Box>

      {/* Range filters */}
      <Paper
        className="report-no-print"
        variant="outlined"
        sx={{ p: 2, mb: 3, borderRadius: 2 }}
      >
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {presetOptions.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              onClick={() => setPreset(opt.value)}
              variant={range.preset === opt.value ? "filled" : "outlined"}
              sx={{
                fontWeight: 600,
                cursor: "pointer",
                ...(range.preset === opt.value
                  ? { bgcolor: ACCENT, color: "#fff" }
                  : {}),
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={range.from}
            onChange={(e) => setCustomFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={range.to}
            onChange={(e) => setCustomTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Status"
            select
            size="small"
            value={range.status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="converted">Converted</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* ===== Printable report ===== */}
      <Paper
        className="report-print-area"
        sx={{ borderRadius: 2, overflow: "hidden" }}
      >
        <Box sx={{ bgcolor: ACCENT, color: "#fff", px: 4, py: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Customer Quotation Statement
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {customerName || "Customer"}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Statement Period
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {rangeLabel}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Generated {getDateFormatted(new Date())}
              </Typography>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: ACCENT }} />
          </Box>
        ) : (
          <Box sx={{ p: 4 }}>
            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  label="Total Quoted"
                  value={formatCurrency(summary.grandTotal)}
                  accent={ACCENT}
                  highlight
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  label="Approved Value"
                  value={formatCurrency(summary.approvedTotal)}
                  sub={`${summary.approvedCount} quote(s)`}
                  accent="#2e7d32"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  label="Pending Value"
                  value={formatCurrency(summary.pendingTotal)}
                  sub={`${summary.pendingCount} quote(s)`}
                  accent="#0288d1"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  label="Quotations / Items"
                  value={String(summary.count)}
                  sub={`${summary.itemsTotal} item(s)`}
                  accent="#616161"
                />
              </Grid>
            </Grid>

            {/* By-status breakdown */}
            {Object.keys(summary.byStatus).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Breakdown by Status
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {Object.entries(summary.byStatus).map(([status, info]) => (
                    <Box
                      key={status}
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 1.5,
                        px: 2,
                        py: 1,
                        minWidth: 150,
                      }}
                    >
                      <Chip
                        label={cap(status)}
                        color={statusColors[status] || "default"}
                        size="small"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      />
                      <Typography fontWeight={700}>
                        {formatCurrency(info.total)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {info.count} quote(s)
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Detail table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700 } }}>
                    <TableCell>Quotation No.</TableCell>
                    <TableCell>Quotation Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Items</TableCell>
                    <TableCell align="right">Quotation Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No quotations found for this period.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((q: any) => (
                      <TableRow key={q.id} hover>
                        <TableCell>
                          <Typography fontWeight={600} variant="body2">
                            {q.quotation_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getDateFormatted(q.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cap(q.status)}
                            color={statusColors[q.status] || "default"}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {q.quotation_items?.length || 0}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} variant="body2">
                            {formatCurrency(Number(q.total) || 0)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {data.length > 0 && (
                    <TableRow sx={{ bgcolor: "#f5f0eb" }}>
                      <TableCell colSpan={4} align="right">
                        <Typography fontWeight={700}>Total</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} sx={{ color: ACCENT }}>
                          {formatCurrency(summary.grandTotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Subtotal / GST / Grand Total breakdown */}
            {data.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 2,
                }}
              >
                <Box sx={{ minWidth: 260 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(summary.subtotalTotal)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      GST
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(summary.gstTotal)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 0.5,
                    }}
                  >
                    <Typography fontWeight={700}>Grand Total</Typography>
                    <Typography fontWeight={700} sx={{ color: ACCENT }}>
                      {formatCurrency(summary.grandTotal)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 2 }}
            >
              <FileText
                size={12}
                style={{ verticalAlign: "middle", marginRight: 4 }}
              />
              Cancelled quotations are excluded from this statement. Cancelled
              total: {formatCurrency(summary.cancelledTotal)} across{" "}
              {summary.cancelledCount} quotations. Converted:{" "}
              {formatCurrency(summary.convertedTotal)} across{" "}
              {summary.convertedCount} quotations.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderLeft: `4px solid ${accent}`,
        height: "100%",
        ...(highlight ? { bgcolor: "#fdf6ef" } : {}),
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: accent, mt: 0.5 }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}
