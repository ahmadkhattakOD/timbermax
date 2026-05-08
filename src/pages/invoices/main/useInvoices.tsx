// hooks/useInvoices.ts (complete version)
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Checkbox,
  TableCell,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  Box,
  Button,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  Select,
} from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import {
  getDateFormatted,
  initialRowsPerPage,
  useDebouncedSearch,
} from "utils/helpers";
import InvoicesRepository, { InvoiceSupabase } from "utils/repositories/invoicesRepository";
import {
  generateAndDownloadInvoicePDF,
  generateDeliveryNotePDF,
  generateInvoicePDFBase64,
} from "utils/invoice-pdf-generator";
import { SnackbarProps } from "types/snackbar";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Download, Send, Wallet, Eye, Truck, X, Bell, Code, RotateCcw, Copy } from "lucide-react";
import emailjs from "@emailjs/browser";
import supabase from "utils/supabase";
import {
  calculateItemTotal,
  calculateTotalBreakdown,
  formatCurrency,
} from "utils/calculateTotals";

// Head cells for the table
const headCells: HeadCell[] = [
  {
    id: "invoice_number",
    numeric: false,
    disablePadding: true,
    label: "Invoice Number",
  },
  {
    id: "customer",
    numeric: false,
    disablePadding: true,
    label: "Customer",
  },
  {
    id: "total",
    numeric: true,
    disablePadding: true,
    label: "Total (A$)",
  },
  {
    id: "deposit",
    numeric: true,
    disablePadding: true,
    label: "Deposit (A$)",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: true,
    label: "Status",
  },
  {
    id: "delivery_status",
    numeric: false,
    disablePadding: true,
    label: "Delivery",
  },
  {
    id: "items_count",
    numeric: true,
    disablePadding: true,
    label: "Items",
  },
  {
    id: "note",
    numeric: false,
    disablePadding: true,
    label: "Note",
  },
  {
    id: "due_date",
    numeric: false,
    disablePadding: true,
    label: "Due Date",
  },
  {
    id: "actions",
    numeric: false,
    disablePadding: true,
    label: "Actions",
  },
];

export function useInvoices() {
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<any[]>([]);
  const [currentInvoiceInfo, setCurrentInvoiceInfo] = useState<any>(null);
  const [filters, setFilters] = useState<any>({});
  const [searchValue, setSearchValue] = useState("");
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const navigate = useNavigate();
  const theme = useTheme();

  // Delivery status menu state
  const [deliveryMenuAnchor, setDeliveryMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [selectedInvoiceForDelivery, setSelectedInvoiceForDelivery] = useState<
    number | null
  >(null);

  // Invoice status menu state
  const [statusMenuAnchor, setStatusMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [selectedInvoiceForStatus, setSelectedInvoiceForStatus] = useState<
    number | null
  >(null);

  // Payment method dialog state
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<
    number | null
  >(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>("");

  // track actions in-progress per-invoice to avoid double clicks
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<number>>(
    new Set(),
  );

  const addActionLoadingId = (id: number) =>
    setActionLoadingIds((prev) => new Set(prev).add(id));

  const removeActionLoadingId = (id: number) =>
    setActionLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const isActionLoading = (id: number) => actionLoadingIds.has(id);

  // Email dialog state
  type EmailTriggerType = "sent" | "paid" | "reminder" | "resend";
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTriggerType, setEmailTriggerType] = useState<EmailTriggerType | null>(null);
  const [emailInvoiceData, setEmailInvoiceData] = useState<any>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailEditMode, setEmailEditMode] = useState<"preview" | "friendly" | "html">("preview");
  const [emailFriendlyGreeting, setEmailFriendlyGreeting] = useState("");
  const [emailFriendlyMain, setEmailFriendlyMain] = useState("");
  const [emailFriendlyClosing, setEmailFriendlyClosing] = useState("");
  const [emailExtraRecipients, setEmailExtraRecipients] = useState<string[]>([]);
  const [emailPdfBase64, setEmailPdfBase64] = useState<string>("");
  const [emailPdfFileName, setEmailPdfFileName] = useState<string>("");
  const [emailPdfDownloadUrl, setEmailPdfDownloadUrl] = useState<string>("");

  // Action functions
  const goToCreate = () => navigate("/invoices/create");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev: any) => ({
      ...prev,
      search: e.target.value || undefined,
    }));
  };

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

  // View items modal
  const viewItemsModal = async (invoiceId: number) => {
    try {
      addActionLoadingId(invoiceId);
      const invoicesRepo = new InvoicesRepository();
      const invoice: any = await invoicesRepo.getSingle(invoiceId);
      console.log("INVOICE", invoice);
      if (!invoice?.invoiceData) {
        openSnackbar({
          open: true,
          message: "Invoice not found.",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      const items = invoice.invoiceData.invoice_items || [];

      if (items.length === 0) {
        openSnackbar({
          open: true,
          message: "No items found in this invoice.",
          variant: "alert",
          alert: { color: "info" },
        } as SnackbarProps);
        return;
      }
      console.log("ITEMSS", items);

      const formattedItems = items.map((item: any, index: number) => ({
        id: index + 1,
        name: item.items?.name || "Unknown",
        code: item.items?.itemCode || "N/A",
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        gst: item?.items?.gst || false,
      }));

      // Calculate totals using utility function
      const discount = parseFloat(invoice.invoiceData.discount) || 0;
      const discountType = invoice.invoiceData.discount_type || "percentage";
      const breakdown = calculateTotalBreakdown(formattedItems, discount, discountType);

      setCurrentInvoiceItems(formattedItems);
      setCurrentInvoiceInfo({
        invoiceNumber: invoice.invoiceData.invoice_number,
        customerName: invoice.invoiceData.customer?.name,
        breakdown,
      });
      setItemsModalOpen(true);
    } catch (error: any) {
      console.error("Error viewing invoice items:", error);
      openSnackbar({
        open: true,
        message: `Failed to load invoice items: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      removeActionLoadingId(invoiceId);
    }
  };

  const closeItemsModal = () => {
    setItemsModalOpen(false);
    setCurrentInvoiceItems([]);
    setCurrentInvoiceInfo(null);
  };

  // PDF Download functions
  const downloadInvoicePDF = useCallback(async (invoiceId: number) => {
    try {
      setLoading(true);
      addActionLoadingId(invoiceId);
      const invoicesRepo = new InvoicesRepository();
      const invoiceResponse: any = await invoicesRepo.getSingle(invoiceId);

      if (!invoiceResponse?.invoiceData) {
        throw new Error(`Invoice with ID ${invoiceId} not found`);
      }

      openSnackbar({
        open: true,
        message: "Generating Invoice PDF...",
        variant: "alert",
        alert: { color: "info" },
      } as SnackbarProps);

      const result = await generateAndDownloadInvoicePDF(
        invoiceResponse.invoiceData,
      );

      if (result.success) {
        openSnackbar({
          open: true,
          message: `Invoice PDF downloaded: ${result.fileName}`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
      } else {
        throw new Error(result.error || "Failed to download PDF");
      }
    } catch (error: any) {
      console.error("Error downloading invoice PDF:", error);
      openSnackbar({
        open: true,
        message: error.message || "Failed to generate PDF",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      setLoading(false);
      removeActionLoadingId(invoiceId);
    }
  }, []);

  const downloadDeliveryNotePDF = useCallback(async (invoiceId: number) => {
    try {
      setLoading(true);
      addActionLoadingId(invoiceId);
      const invoicesRepo = new InvoicesRepository();
      const invoiceResponse: any = await invoicesRepo.getSingle(invoiceId);

      if (!invoiceResponse?.invoiceData) {
        throw new Error(`Invoice with ID ${invoiceId} not found`);
      }

      openSnackbar({
        open: true,
        message: "Generating Delivery Note...",
        variant: "alert",
        alert: { color: "info" },
      } as SnackbarProps);

      const result = await generateDeliveryNotePDF(invoiceResponse.invoiceData);

      if (result.success) {
        openSnackbar({
          open: true,
          message: `Delivery Note downloaded: ${result.fileName}`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
      } else {
        throw new Error(result.error || "Failed to download delivery note");
      }
    } catch (error: any) {
      console.error("Error downloading delivery note:", error);
      openSnackbar({
        open: true,
        message: error.message || "Failed to generate delivery note",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      setLoading(false);
      removeActionLoadingId(invoiceId);
    }
  }, []);

  // Generate table cells with all actions
  const generateTableCells = (
    row: any,
    labelId: string,
    isItemSelected: boolean,
  ) => {
    const itemsCount = row.invoice_items?.length || 0;
    const canMarkPaid = row.status === "sent" || row.status === "draft" || row.status === "overdue";
    const canCancel = row.status !== "cancelled" && row.status !== "paid";
    const canMarkSent = row.status === "draft" || row.status === "overdue";
    const canUpdateDelivery = row.status !== "cancelled";
    const canDownloadDeliveryNote =
      row.status !== "cancelled" && itemsCount > 0;

    const canDownloadPDF = row.status !== "cancelled";

    // Status chip colors
    const statusColors: any = {
      draft: "warning",
      sent: "info",
      paid: "success",
      cancelled: "error",
      overdue: "error",
    };

    // Delivery status chip colors
    const deliveryColors: any = {
      packed: "info",
      shipped: "primary",
      delivered: "success",
      returned: "error",
      pending: "warning",
      pick_up: "secondary",
    };

    const deliveryLabels: any = {
      pending: "Pending",
      packed: "Packed",
      shipped: "Shipped",
      delivered: "Delivered",
      returned: "Returned",
      pick_up: "Pick Up",
    };

    return (
      <>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={isItemSelected}
            inputProps={{
              "aria-labelledby": labelId,
            }}
          />
        </TableCell>
        <TableCell
          component="th"
          id={labelId}
          scope="row"
          padding="none"
          sx={{ minWidth: 180 }}
        >
          <Typography fontWeight={600}>{row.invoice_number}</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 180 }}>
          <Typography>{row.customers?.name || "N/A"}</Typography>
        </TableCell>
        <TableCell align="right" sx={{ minWidth: 120 }}>
          {/* Show total from invoice record (includes GST and discount) */}
          <Typography fontWeight={600}>
            ${(Number(row.total) || 0).toFixed(2)}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ minWidth: 120 }}>
          {row.deposit ? (
            <Typography fontWeight={600} color="primary">
              ${(Number(row.deposit) || 0).toFixed(2)}
            </Typography>
          ) : (
            <Typography color="text.secondary">—</Typography>
          )}
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Chip
            label={row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
            color={statusColors[row.status] || "default"}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInvoiceForStatus(row.id);
              setStatusMenuAnchor(e.currentTarget);
            }}
            sx={{
              fontWeight: 600,
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
            }}
          />
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Chip
            label={deliveryLabels[row.delivery_status || "pending"] || row.delivery_status}
            color={deliveryColors[row.delivery_status || "pending"]}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInvoiceForDelivery(row.id);
              setDeliveryMenuAnchor(e.currentTarget);
            }}
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              "&:hover": { opacity: 0.8 },
            }}
          />
        </TableCell>
        <TableCell align="center" sx={{ minWidth: 80 }}>
          <Typography>{itemsCount}</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <Typography variant="body2">{row.note || "-"}</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {row.due_date ? (
            <Box>
              <Typography variant="body2">
                {getDateFormatted(row.due_date)}
              </Typography>
              {/* Show days overdue if applicable */}
              {row.status === 'overdue' && (
                <Typography variant="caption" color="error" fontWeight={600}>
                  {Math.floor(
                    (new Date().getTime() - new Date(row.due_date).getTime())
                    / (1000 * 60 * 60 * 24)
                  )} days overdue
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No due date
            </Typography>
          )}
        </TableCell>
        <TableCell sx={{ minWidth: 300 }}>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {/* Download Invoice PDF */}
            {canDownloadPDF && (
              <Tooltip title="Download Invoice PDF">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadInvoicePDF(row.id);
                    }}
                    color="primary"
                    disabled={isActionLoading(row.id)}
                  >
                    {isActionLoading(row.id) ? (
                      <CircularProgress size={18} thickness={5} />
                    ) : (
                      <Download size={18} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Download Delivery Note */}
            {canDownloadDeliveryNote && (
              <Tooltip title="Download Delivery Note">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadDeliveryNotePDF(row.id);
                    }}
                    color="warning"
                    disabled={isActionLoading(row.id)}
                  >
                    {isActionLoading(row.id) ? (
                      <CircularProgress size={18} thickness={5} />
                    ) : (
                      <Truck size={18} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Mark as Sent */}
            {canMarkSent && (
              <Tooltip title="Mark as Sent">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsSent(row.id);
                    }}
                    color="info"
                    disabled={isActionLoading(row.id)}
                  >
                    {isActionLoading(row.id) ? (
                      <CircularProgress size={18} thickness={5} />
                    ) : (
                      <Send size={18} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Send Reminder */}
            {(row.status === "sent" || row.status === "overdue") && (
              <Tooltip title="Send Reminder">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendReminder(row.id);
                    }}
                    color="warning"
                    disabled={isActionLoading(row.id)}
                  >
                    {isActionLoading(row.id) ? (
                      <CircularProgress size={18} thickness={5} />
                    ) : (
                      <Bell size={18} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Resend Email */}
            {(row.status === "sent" || row.status === "paid" || row.status === "overdue") && (
              <Tooltip title="Resend Email">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      resendEmail(row.id);
                    }}
                    color="primary"
                    disabled={isActionLoading(row.id)}
                  >
                    {isActionLoading(row.id) ? (
                      <CircularProgress size={18} thickness={5} />
                    ) : (
                      <RotateCcw size={18} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Mark as Paid */}
            {canMarkPaid && (
              <Tooltip title="Mark as Paid">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsPaid(row.id);
                    }}
                    color="success"
                    disabled={isActionLoading(row.id)}
                  >
                    {isActionLoading(row.id) ? (
                      <CircularProgress size={18} thickness={5} />
                    ) : (
                      <Wallet size={18} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* View Items */}
            {itemsCount > 0 && (
              <Tooltip title="View Items">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewItemsModal(row.id);
                    }}
                    color="info"
                    disabled={isActionLoading(row.id)}
                  >
                    {isActionLoading(row.id) ? (
                      <CircularProgress size={18} thickness={5} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Cancel Invoice */}
            {canCancel && (
              <Tooltip title="Cancel Invoice">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelInvoice(row.id);
                    }}
                    color="error"
                    disabled={isActionLoading(row.id)}
                  >
                    {isActionLoading(row.id) ? (
                      <CircularProgress size={18} thickness={5} />
                    ) : (
                      <X size={18} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Duplicate Invoice */}
            <Tooltip title="Duplicate Invoice">
              <span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateInvoice(row.id);
                  }}
                  disabled={isActionLoading(row.id)}
                >
                  {isActionLoading(row.id) ? (
                    <CircularProgress size={18} thickness={5} />
                  ) : (
                    <Copy size={18} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </TableCell>
      </>
    );
  };

  // Static payment methods array (doesn't need to be recreated on each render)
  const paymentMethods = useMemo(
    () => [
      { label: "Cash", value: "cash" },
      { label: "Credit Card", value: "credit_card" },
      { label: "Debit Card", value: "debit_card" },
      { label: "Bank Transfer", value: "bank_transfer" },
      { label: "Check", value: "check" },
      { label: "PayPal", value: "paypal" },
      { label: "Other", value: "other" },
    ],
    []
  );

  // Memoized callback for closing payment dialog
  const handleClosePaymentDialog = useCallback(() => {
    setPaymentMethodDialogOpen(false);
    setSelectedInvoiceForPayment(null);
    setSelectedPaymentMethod("");
    setCustomPaymentMethod("");
  }, []);

  // Memoized callback for payment method selection
  const handlePaymentMethodSelect = useCallback(
    (e: any) => {
      setSelectedPaymentMethod(e.target.value);
    },
    []
  );

  // Memoized callback for custom payment method input
  const handleCustomPaymentMethodChange = useCallback(
    (e: any) => {
      setCustomPaymentMethod(e.target.value);
    },
    []
  );

  // Memoized getData function
  const getData = useCallback(async () => {
    try {
      setLoading(true);
      const invoicesRepo = new InvoicesRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const invoices = await invoicesRepo.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters,
      );
      if (invoices) {
        const { invoicesData, invoicesCount, invoicesError } = invoices;
        if (invoicesData && !invoicesError) {
          setData(invoicesData as any);
          setDataCount(invoicesCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching invoices:", e);
      setLoading(false);
    }
  }, [rowsPerPage, page, orderBy, order, filters]);

  // Memoized callback for confirming mark as paid
  const confirmMarkAsPaid = useCallback(async () => {
    if (!selectedInvoiceForPayment) return;

    // Validate payment method
    const paymentMethod =
      selectedPaymentMethod === "other"
        ? customPaymentMethod.trim()
        : selectedPaymentMethod;

    if (!paymentMethod) {
      openSnackbar({
        open: true,
        message: "Please select or enter a payment method",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
      return;
    }

    try {
      addActionLoadingId(selectedInvoiceForPayment);
      const invoicesRepo = new InvoicesRepository();
      const result = await invoicesRepo.markAsPaid(
        selectedInvoiceForPayment,
        paymentMethod
      );

      if (result) {
        openSnackbar({
          open: true,
          message: `Invoice marked as paid (${paymentMethod})`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
        setPaymentMethodDialogOpen(false);
        setSelectedInvoiceForPayment(null);
        setSelectedPaymentMethod("");
        setCustomPaymentMethod("");
        await getData();
      } else {
        throw new Error("Failed to mark as paid");
      }
    } catch (error: any) {
      console.error("Error marking invoice as paid:", error);
      openSnackbar({
        open: true,
        message: `Failed to mark as paid: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      if (selectedInvoiceForPayment) {
        removeActionLoadingId(selectedInvoiceForPayment);
      }
    }
  }, [
    selectedInvoiceForPayment,
    selectedPaymentMethod,
    customPaymentMethod,
    addActionLoadingId,
    removeActionLoadingId,
    getData,
  ]);

  // Memoized Payment Method Dialog component
  const PaymentMethodDialog = useMemo(
    () => (
      <Dialog
        open={paymentMethodDialogOpen}
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Payment Method</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <Select
                value={selectedPaymentMethod}
                onChange={handlePaymentMethodSelect}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select payment method
                </MenuItem>
                {paymentMethods.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedPaymentMethod === "other" && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Enter Payment Method"
                  value={customPaymentMethod}
                  onChange={handleCustomPaymentMethodChange}
                  placeholder="e.g., Stripe, Square, etc."
                  autoFocus
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePaymentDialog} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={confirmMarkAsPaid}
            variant="contained"
            color="success"
            disabled={
              !selectedPaymentMethod ||
              (selectedPaymentMethod === "other" && !customPaymentMethod.trim())
            }
          >
            Mark as Paid
          </Button>
        </DialogActions>
      </Dialog>
    ),
    [
      paymentMethodDialogOpen,
      selectedPaymentMethod,
      customPaymentMethod,
      paymentMethods,
      handleClosePaymentDialog,
      handlePaymentMethodSelect,
      handleCustomPaymentMethodChange,
      confirmMarkAsPaid,
    ]
  );

  // Items modal component
  const ItemsModal = () => (
    <Dialog
      open={itemsModalOpen}
      onClose={closeItemsModal}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "70vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e0e0e0",
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" component="div">
            Invoice Items
          </Typography>
          {currentInvoiceInfo && (
            <Typography variant="body2" color="text.secondary">
              {currentInvoiceInfo.invoiceNumber} -{" "}
              {currentInvoiceInfo.customerName}
            </Typography>
          )}
        </Box>
        <IconButton onClick={closeItemsModal} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">GST</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentInvoiceItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell align="right">
                    {item.quantity.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ${item.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      {item.gst ? "Yes" : "No"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      {formatCurrency(calculateItemTotal(item))}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}

              {/* Subtotal Row */}
              <TableRow>
                <TableCell colSpan={6} align="right">
                  <Typography fontWeight={600}>Subtotal:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={600}>
                    {formatCurrency(currentInvoiceInfo?.breakdown?.subtotal || 0)}
                  </Typography>
                </TableCell>
              </TableRow>

              {/* GST Row */}
              {currentInvoiceInfo?.breakdown?.gstAmount > 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="right">
                    <Typography>GST (10%):</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>
                      {formatCurrency(currentInvoiceInfo.breakdown.gstAmount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Discount Row */}
              {currentInvoiceInfo?.breakdown?.discountAmount > 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="right">
                    <Typography>
                      {currentInvoiceInfo.breakdown.discountType === "fixed"
                        ? `Discount ($${currentInvoiceInfo.breakdown.discountValue.toFixed(2)}):`
                        : `Discount (${currentInvoiceInfo.breakdown.discountPercentage}%):`}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography color="error">
                      -{formatCurrency(currentInvoiceInfo.breakdown.discountAmount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Final Total Row */}
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell colSpan={6} align="right">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Total:
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight={700}>
                    {formatCurrency(currentInvoiceInfo?.breakdown?.finalTotal || 0)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: "1px solid #e0e0e0",
          pt: 2,
          pb: 2,
          px: 3,
        }}
      >
        <Button onClick={closeItemsModal} color="primary" variant="outlined">
          Close
        </Button>
        <Button
          onClick={() => {
            if (currentInvoiceInfo?.invoiceNumber) {
              const invoiceId = data.find(
                (inv) =>
                  inv.invoice_number === currentInvoiceInfo.invoiceNumber,
              )?.id;
              if (invoiceId) {
                downloadInvoicePDF(invoiceId);
              }
            }
          }}
          color="primary"
          variant="contained"
          startIcon={<Download size={16} />}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ========== EMAIL DIALOG FUNCTIONS ==========

  const emailHeader = `<div style="background-color:#9C6A3A;padding:24px 32px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">TIMBER MAX SUPPLY PTY LTD</h1>
    <p style="color:#f0e0cc;margin:4px 0 0 0;font-size:13px;">ABN: 95 688 199 773</p>
  </div>`;

  const emailFooter = `<div style="background-color:#f5f0eb;padding:16px 32px;text-align:center;font-size:12px;color:#888;">
    <p style="margin:0;">Timber Max Supply Pty Ltd | ABN: 95 688 199 773</p>
    <p style="margin:4px 0 0 0;">Phone: 08 8212 4703 | Email: info@timbermax.com.au | timbermax.com.au</p>
  </div>`;

  const wrapEmailTemplate = (content: string) =>
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#ffffff;">${emailHeader}<div style="padding:32px;">${content}</div>${emailFooter}</div>`;

  // Maps "resend" to the actual content type based on the invoice's current status
  const getEffectiveTriggerType = (
    triggerType: EmailTriggerType,
    invoice: any,
  ): "sent" | "paid" | "reminder" => {
    if (triggerType !== "resend") return triggerType;
    if (invoice?.status === "paid") return "paid";
    if (invoice?.status === "overdue") return "reminder";
    return "sent";
  };

  // Extract plain-text parts that are user-editable
  const getEmailFriendlyParts = (triggerType: EmailTriggerType, invoice: any) => {
    const effectiveType = getEffectiveTriggerType(triggerType, invoice);
    triggerType = effectiveType;
    const name = invoice.customers?.name || "Customer";
    const invNum = invoice.invoice_number || "";
    const total = `$${(Number(invoice.total) || 0).toFixed(2)}`;
    const daysOverdue = invoice.due_date
      ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    if (triggerType === "sent") {
      return {
        greeting: `Dear ${name},`,
        main: `Your invoice ${invNum} for ${total} has been issued and is now available for payment.`,
        closing: `If you have any questions regarding this invoice, please do not hesitate to contact us.\n\nKind regards,\nTimber Max Supply`,
      };
    }
    if (triggerType === "paid") {
      return {
        greeting: `Dear ${name},`,
        main: `Thank you for your payment of invoice ${invNum} for ${total}. Your payment has been received and recorded.`,
        closing: `We appreciate your prompt payment and look forward to continued business with you.\n\nKind regards,\nTimber Max Supply`,
      };
    }
    // reminder
    return {
      greeting: `Dear ${name},`,
      main: `This is a friendly reminder that invoice ${invNum} for ${total} is overdue${daysOverdue > 0 ? ` by ${daysOverdue} days` : ""}.`,
      closing: `Please arrange payment at your earliest convenience. If payment has already been made, please disregard this notice.\n\nKind regards,\nTimber Max Supply`,
    };
  };

  // Rebuild the full HTML body from friendly parts + auto-generated info block
  const buildBodyFromParts = (
    triggerType: EmailTriggerType,
    invoice: any,
    greeting: string,
    main: string,
    closing: string,
    downloadUrl?: string,
  ): string => {
    triggerType = getEffectiveTriggerType(triggerType, invoice);
    const invNum = invoice.invoice_number || "";
    const total = `$${(Number(invoice.total) || 0).toFixed(2)}`;
    const dueDate = invoice.due_date ? getDateFormatted(invoice.due_date) : "";
    const daysOverdue = invoice.due_date
      ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Convert plain-text blocks (split on blank lines) to HTML paragraphs
    const textToHtml = (text: string, defaultStyle = "font-size:15px;color:#555;line-height:1.6;") =>
      text.split(/\n\n/).map((para) =>
        `<p style="${defaultStyle}">${para.replace(/\n/g, "<br/>")}</p>`
      ).join("");

    const downloadSection = downloadUrl
      ? `<div style="text-align:center;margin:28px 0 8px 0;">
          <a href="${downloadUrl}" target="_blank"
             style="background-color:#9C6A3A;color:#ffffff;padding:12px 32px;text-decoration:none;border-radius:4px;font-size:15px;font-weight:600;display:inline-block;">
            Download Invoice PDF
          </a>
          <p style="font-size:11px;color:#aaa;margin:6px 0 0 0;">Link expires in 30 days</p>
        </div>`
      : "";

    let infoBox = "";
    if (triggerType === "sent") {
      infoBox = `<div style="background-color:#fdf6ef;border-left:4px solid #9C6A3A;padding:16px;margin:24px 0;border-radius:4px;">
        <p style="margin:0;font-size:14px;color:#333;">
          <strong>Invoice:</strong> ${invNum}<br/>
          <strong>Amount:</strong> ${total}${dueDate ? `<br/><strong>Due:</strong> ${dueDate}` : ""}
        </p>
      </div>`;
    } else if (triggerType === "paid") {
      infoBox = `<div style="background-color:#edf7ed;border-left:4px solid #4caf50;padding:16px;margin:24px 0;border-radius:4px;">
        <p style="margin:0;font-size:14px;color:#333;">
          <strong>Status:</strong> PAID<br/>
          <strong>Invoice:</strong> ${invNum}<br/>
          <strong>Amount:</strong> ${total}
        </p>
      </div>`;
    } else {
      infoBox = `<div style="background-color:#fdecea;border-left:4px solid #f44336;padding:16px;margin:24px 0;border-radius:4px;">
        <p style="margin:0;font-size:14px;color:#333;">
          <strong>Invoice:</strong> ${invNum}<br/>
          <strong>Amount Due:</strong> ${total}${dueDate ? `<br/><strong>Due Date:</strong> ${dueDate}` : ""}
          ${daysOverdue > 0 ? `<br/><strong>Days Overdue:</strong> ${daysOverdue}` : ""}
        </p>
      </div>`;
    }

    const dueDatePara = triggerType === "sent" && dueDate
      ? `<p style="font-size:15px;color:#555;"><strong>Due Date:</strong> ${dueDate}</p>`
      : "";

    const content = `
      <p style="font-size:16px;color:#333;">${greeting}</p>
      <p style="font-size:15px;color:#555;line-height:1.6;">${main}</p>
      ${dueDatePara}
      ${infoBox}
      ${downloadSection}
      ${textToHtml(closing)}
    `;

    return wrapEmailTemplate(content);
  };

  const generateEmailBody = (
    triggerType: EmailTriggerType,
    invoice: any,
    downloadUrl?: string,
  ): { subject: string; body: string } => {
    const invNum = invoice.invoice_number || "";
    const daysOverdue = invoice.due_date
      ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const parts = getEmailFriendlyParts(triggerType, invoice);
    const effectiveType = getEffectiveTriggerType(triggerType, invoice);

    const baseSubjects: Record<"sent" | "paid" | "reminder", string> = {
      sent: `Invoice ${invNum} from Timber Max Supply`,
      paid: `Payment Confirmation - ${invNum}`,
      reminder: `Payment Reminder - ${invNum}${daysOverdue > 0 ? " (Overdue)" : ""}`,
    };

    const subject = triggerType === "resend"
      ? `[Resend] ${baseSubjects[effectiveType]}`
      : baseSubjects[effectiveType];

    return {
      subject,
      body: buildBodyFromParts(triggerType, invoice, parts.greeting, parts.main, parts.closing, downloadUrl),
    };
  };

  // Upload base64 PDF to Supabase Storage and return a 30-day signed URL
  const uploadPdfToStorage = async (
    base64DataUri: string,
    invoiceNumber: string,
  ): Promise<string | null> => {
    try {
      const base64Data = base64DataUri.split(",")[1] || base64DataUri;
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const filePath = `invoices/${invoiceNumber}_${Date.now()}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, blob, { upsert: true, contentType: "application/pdf" });

      if (uploadError || !uploadData) {
        console.error("Failed to upload PDF to storage:", uploadError);
        return null;
      }

      const { data: urlData } = await supabase.storage
        .from("gallery")
        .createSignedUrl(uploadData.path, 60 * 60 * 24 * 30); // 30 days

      return urlData?.signedUrl || null;
    } catch (e) {
      console.error("Error uploading PDF to storage:", e);
      return null;
    }
  };

  const openEmailDialog = async (triggerType: EmailTriggerType, row: any) => {
    // Open dialog immediately with body (no PDF link yet)
    const { subject, body } = generateEmailBody(triggerType, row);
    const parts = getEmailFriendlyParts(triggerType, row);
    setEmailTriggerType(triggerType);
    setEmailInvoiceData(row);
    setEmailTo(row.customers?.email || "");
    setEmailSubject(subject);
    setEmailBody(body);
    setEmailFriendlyGreeting(parts.greeting);
    setEmailFriendlyMain(parts.main);
    setEmailFriendlyClosing(parts.closing);
    setEmailEditMode("preview");
    setEmailPdfBase64("");
    setEmailPdfFileName("");
    setEmailPdfDownloadUrl("");
    setEmailExtraRecipients(["info@timbermax.com.au"]);
    setEmailDialogOpen(true);

    // Generate compressed PDF, upload to storage, then inject download link into body
    try {
      const invoicesRepo = new InvoicesRepository();
      const invoiceResponse: any = await invoicesRepo.getSingle(row.id);
      if (invoiceResponse?.invoiceData) {
        // Override status with the new target status so the PDF reflects what it's being changed to
        const targetStatus = triggerType === "sent" ? "sent" : triggerType === "paid" ? "paid" : invoiceResponse.invoiceData.status; // "resend" and "reminder" use current status
        const invoiceDataForPdf = { ...invoiceResponse.invoiceData, status: targetStatus };
        const pdfResult = await generateInvoicePDFBase64(invoiceDataForPdf);
        if (pdfResult.success && pdfResult.base64) {
          const fileName = pdfResult.fileName || `invoice_${row.invoice_number}.pdf`;
          setEmailPdfBase64(pdfResult.base64);
          setEmailPdfFileName(fileName);

          // Upload and get a real signed URL
          const downloadUrl = await uploadPdfToStorage(pdfResult.base64, row.invoice_number);
          if (downloadUrl) {
            setEmailPdfDownloadUrl(downloadUrl);
            // Re-generate body with the download button injected
            const { body: updatedBody } = generateEmailBody(triggerType, row, downloadUrl);
            setEmailBody(updatedBody);
          }
        }
      }
    } catch (e) {
      console.error("Failed to generate/upload PDF for email:", e);
    }
  };

  const closeEmailDialog = () => {
    setEmailDialogOpen(false);
    setEmailTriggerType(null);
    setEmailInvoiceData(null);
    setEmailTo("");
    setEmailSubject("");
    setEmailBody("");
    setEmailSending(false);
    setEmailEditMode("preview");
    setEmailFriendlyGreeting("");
    setEmailFriendlyMain("");
    setEmailFriendlyClosing("");
    setEmailExtraRecipients([]);
    setEmailPdfBase64("");
    setEmailPdfFileName("");
    setEmailPdfDownloadUrl("");
  };

  const proceedAfterEmail = async () => {
    if (!emailInvoiceData) return;
    const invoiceId = emailInvoiceData.id;

    if (emailTriggerType === "sent") {
      try {
        addActionLoadingId(invoiceId);
        const invoicesRepo = new InvoicesRepository();
        const result = await invoicesRepo.updateStatus(invoiceId, "sent");
        if (result) {
          openSnackbar({
            open: true,
            message: "Invoice marked as sent",
            variant: "alert",
            alert: { color: "success" },
          } as SnackbarProps);
          await getData();
        } else {
          throw new Error("Failed to update status");
        }
      } catch (error: any) {
        openSnackbar({
          open: true,
          message: `Failed to mark as sent: ${error.message}`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
      } finally {
        removeActionLoadingId(invoiceId);
      }
    } else if (emailTriggerType === "paid") {
      // Chain into the existing payment method dialog
      setSelectedInvoiceForPayment(invoiceId);
      setSelectedPaymentMethod("");
      setCustomPaymentMethod("");
      setPaymentMethodDialogOpen(true);
    }
    // For "reminder" and "resend" — no status change needed
  };

  const sendEmail = async () => {
    if (!emailTo) {
      openSnackbar({
        open: true,
        message: "Customer email address is missing.",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
      return;
    }

    try {
      setEmailSending(true);

      const allRecipients = [emailTo, ...emailExtraRecipients.map((e) => e.trim())].filter(Boolean);

      await Promise.all(
        allRecipients.map((recipient) =>
          emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            { to_email: recipient, subject: emailSubject, body: emailBody },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
          )
        )
      );

      openSnackbar({
        open: true,
        message: `Email sent to ${allRecipients.join(", ")}`,
        variant: "alert",
        alert: { color: "success" },
      } as SnackbarProps);

      await proceedAfterEmail();
    } catch (error: any) {
      console.error("EmailJS error:", error);
      openSnackbar({
        open: true,
        message: `Failed to send email: ${error?.text || error?.message || "Unknown error"}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      setEmailSending(false);
      closeEmailDialog();
    }
  };

  const skipEmail = async () => {
    await proceedAfterEmail();
    closeEmailDialog();
  };

  const sendReminder = (invoiceId: number) => {
    const row = data.find((inv: any) => inv.id === invoiceId);
    if (!row) return;
    openEmailDialog("reminder", row);
  };

  const resendEmail = (invoiceId: number) => {
    const row = data.find((inv: any) => inv.id === invoiceId);
    if (!row) return;
    openEmailDialog("resend", row);
  };

  // Memoized Email Dialog component
  const EmailDialog = useMemo(
    () => {
      const triggerTitles: Record<string, string> = {
        sent: "Send Invoice Email",
        paid: "Send Payment Confirmation",
        reminder: "Send Payment Reminder",
        resend: "Resend Email",
      };

      const triggerColors: Record<string, string> = {
        sent: "#9C6A3A",
        paid: "#4caf50",
        reminder: "#f44336",
        resend: "#1976d2",
      };

      const accentColor = triggerColors[emailTriggerType || "sent"];

      return (
        <Dialog
          open={emailDialogOpen}
          onClose={closeEmailDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, overflow: "hidden" },
          }}
        >
          {/* Colored header bar */}
          <Box sx={{ backgroundColor: accentColor, px: 3, py: 2 }}>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
              {triggerTitles[emailTriggerType || "sent"]}
            </Typography>
            {emailInvoiceData && (
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5 }}>
                {emailInvoiceData.invoice_number} — {emailInvoiceData.customers?.name || "Customer"}
              </Typography>
            )}
          </Box>

          <DialogContent sx={{ px: 3, py: 2.5 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* To & Subject fields */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="To"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ flex: 1 }}
                  type="email"
                />
                <TextField
                  label="Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ flex: 2 }}
                />
              </Box>

              {/* Extra recipients */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {emailExtraRecipients.map((addr, idx) => (
                  <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      label={`CC ${idx + 1}`}
                      value={addr}
                      onChange={(e) => {
                        const updated = [...emailExtraRecipients];
                        updated[idx] = e.target.value;
                        setEmailExtraRecipients(updated);
                      }}
                      fullWidth
                      size="small"
                      type="email"
                      placeholder="additional@email.com"
                    />
                    <IconButton
                      size="small"
                      onClick={() => setEmailExtraRecipients(emailExtraRecipients.filter((_, i) => i !== idx))}
                      sx={{ flexShrink: 0, color: "text.secondary" }}
                    >
                      <X size={16} />
                    </IconButton>
                  </Box>
                ))}
                <Box>
                  <Button
                    size="small"
                    onClick={() => setEmailExtraRecipients([...emailExtraRecipients, ""])}
                    sx={{ textTransform: "none", fontSize: "13px", color: "text.secondary", px: 0 }}
                  >
                    + Add recipient
                  </Button>
                </Box>
              </Box>

              {/* PDF Attachment indicator */}
              <Box sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                backgroundColor: "#9C6A3A",
                borderRadius: 1.5,
                px: 2,
                py: 1.5,
              }}>
                <Download size={18} style={{ color: "#fff", flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#fff" }}>
                    {emailPdfFileName || "Invoice PDF"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                    {emailPdfDownloadUrl
                      ? "Download link ready — included in email body"
                      : emailPdfBase64
                      ? "Uploading to get download link…"
                      : "Generating PDF…"}
                  </Typography>
                </Box>
                {emailPdfDownloadUrl ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = emailPdfBase64;
                      link.download = emailPdfFileName;
                      link.click();
                    }}
                    sx={{
                      textTransform: "none",
                      flexShrink: 0,
                      borderColor: "#fff",
                      color: "#fff",
                      "&:hover": { borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.15)" },
                    }}
                  >
                    Preview PDF
                  </Button>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: "#fff" }} />
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
                      {emailPdfBase64 ? "Uploading…" : "Generating…"}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Mode selector tabs */}
              <Box sx={{ display: "flex", gap: 0.5, borderBottom: "1px solid #e0e0e0", pb: 0 }}>
                {(["preview", "friendly", "html"] as const).map((mode) => {
                  const labels: Record<string, string> = {
                    preview: "Preview",
                    friendly: "Edit Content",
                    html: "Edit HTML",
                  };
                  const isActive = emailEditMode === mode;
                  return (
                    <Button
                      key={mode}
                      size="small"
                      onClick={() => setEmailEditMode(mode)}
                      startIcon={mode === "html" ? <Code size={13} /> : undefined}
                      sx={{
                        textTransform: "none",
                        fontSize: "13px",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? accentColor : "text.secondary",
                        borderBottom: isActive ? `2px solid ${accentColor}` : "2px solid transparent",
                        borderRadius: 0,
                        px: 1.5,
                        pb: 0.75,
                        minHeight: 0,
                        "&:hover": { backgroundColor: "transparent", color: accentColor },
                      }}
                    >
                      {labels[mode]}
                    </Button>
                  );
                })}
              </Box>

              {/* Preview mode */}
              {emailEditMode === "preview" && (
                <Box
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    overflow: "hidden",
                    maxHeight: 380,
                    overflowY: "auto",
                    backgroundColor: "#fff",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                  }}
                  dangerouslySetInnerHTML={{ __html: emailBody }}
                />
              )}

              {/* Edit Content (friendly) mode */}
              {emailEditMode === "friendly" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Edit the message content below. Invoice details (amounts, dates) in the highlighted box are auto-populated from the invoice.
                  </Typography>
                  <TextField
                    label="Greeting"
                    value={emailFriendlyGreeting}
                    onChange={(e) => {
                      setEmailFriendlyGreeting(e.target.value);
                      if (emailInvoiceData && emailTriggerType) {
                        setEmailBody(buildBodyFromParts(
                          emailTriggerType, emailInvoiceData,
                          e.target.value, emailFriendlyMain, emailFriendlyClosing,
                          emailPdfDownloadUrl || undefined,
                        ));
                      }
                    }}
                    fullWidth
                    size="small"
                    placeholder="e.g. Dear John,"
                  />
                  <TextField
                    label="Main Message"
                    value={emailFriendlyMain}
                    onChange={(e) => {
                      setEmailFriendlyMain(e.target.value);
                      if (emailInvoiceData && emailTriggerType) {
                        setEmailBody(buildBodyFromParts(
                          emailTriggerType, emailInvoiceData,
                          emailFriendlyGreeting, e.target.value, emailFriendlyClosing,
                          emailPdfDownloadUrl || undefined,
                        ));
                      }
                    }}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    placeholder="Main message paragraph…"
                  />
                  <TextField
                    label="Closing & Sign-off"
                    value={emailFriendlyClosing}
                    onChange={(e) => {
                      setEmailFriendlyClosing(e.target.value);
                      if (emailInvoiceData && emailTriggerType) {
                        setEmailBody(buildBodyFromParts(
                          emailTriggerType, emailInvoiceData,
                          emailFriendlyGreeting, emailFriendlyMain, e.target.value,
                          emailPdfDownloadUrl || undefined,
                        ));
                      }
                    }}
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                    placeholder={"Closing sentence…\n\nKind regards,\nCompany Name"}
                    helperText="Use a blank line to separate paragraphs (e.g. between closing sentence and sign-off)"
                  />
                  {/* Mini live preview */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      Live Preview
                    </Typography>
                    <Box
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 1.5,
                        overflow: "hidden",
                        maxHeight: 220,
                        overflowY: "auto",
                        backgroundColor: "#fff",
                        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                        transform: "scale(0.85)",
                        transformOrigin: "top left",
                        width: "118%",
                      }}
                      dangerouslySetInnerHTML={{ __html: emailBody }}
                    />
                  </Box>
                </Box>
              )}

              {/* Edit HTML mode */}
              {emailEditMode === "html" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Advanced: edit the raw HTML directly. Changes here override the "Edit Content" fields.
                  </Typography>
                  <TextField
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    fullWidth
                    multiline
                    rows={14}
                    size="small"
                    InputProps={{
                      sx: { fontFamily: "monospace", fontSize: "12px" },
                    }}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
            {emailTriggerType !== "reminder" && emailTriggerType !== "resend" && (
              <Button
                onClick={skipEmail}
                variant="outlined"
                color="inherit"
                disabled={emailSending}
                sx={{ textTransform: "none", mr: "auto" }}
              >
                Skip Email
              </Button>
            )}
            <Button
              onClick={closeEmailDialog}
              color="inherit"
              disabled={emailSending}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              onClick={sendEmail}
              variant="contained"
              disabled={emailSending || !emailTo || !emailPdfDownloadUrl}
              startIcon={emailSending ? <CircularProgress size={16} /> : <Send size={16} />}
              sx={{
                textTransform: "none",
                backgroundColor: accentColor,
                "&:hover": { backgroundColor: accentColor, opacity: 0.9 },
              }}
            >
              {emailSending ? "Sending..." : "Send Email"}
            </Button>
          </DialogActions>
        </Dialog>
      );
    },
    [
      emailDialogOpen,
      emailTriggerType,
      emailInvoiceData,
      emailTo,
      emailSubject,
      emailBody,
      emailSending,
      emailEditMode,
      emailFriendlyGreeting,
      emailFriendlyMain,
      emailFriendlyClosing,
      emailExtraRecipients,
      emailPdfBase64,
      emailPdfFileName,
      emailPdfDownloadUrl,
    ]
  );

  // ========== ACTION FUNCTIONS ==========

  const markAsSent = (invoiceId: number) => {
    const row = data.find((inv: any) => inv.id === invoiceId);
    if (!row) return;
    openEmailDialog("sent", row);
  };

  const markAsPaid = (invoiceId: number) => {
    const row = data.find((inv: any) => inv.id === invoiceId);
    if (!row) return;
    openEmailDialog("paid", row);
  };

  const cancelInvoice = async (invoiceId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this invoice? This will restore stock.",
      )
    ) {
      return;
    }

    try {
      addActionLoadingId(invoiceId);
      const invoicesRepo = new InvoicesRepository();
      const result = await invoicesRepo.cancelInvoice(invoiceId);

      if (result?.success) {
        openSnackbar({
          open: true,
          message: `Invoice cancelled. Stock restored for ${result.restoredItems} items.`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
        await getData();
      } else {
        openSnackbar({
          open: true,
          message: `Failed to cancel invoice: ${result?.error}`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
      }
    } catch (error: any) {
      console.error("Error cancelling invoice:", error);
      openSnackbar({
        open: true,
        message: `Failed to cancel invoice: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      removeActionLoadingId(invoiceId);
    }
  };

  const duplicateInvoice = async (invoiceId: number) => {
    try {
      addActionLoadingId(invoiceId);
      const invoicesRepo = new InvoicesRepository();

      const invoiceResponse: any = await invoicesRepo.getSingle(invoiceId);
      if (!invoiceResponse?.invoiceData) {
        throw new Error("Invoice not found");
      }

      const existing = invoiceResponse.invoiceData;
      const nextNumber = await invoicesRepo.getNextInvoiceNumber();

      const newInvoice: InvoiceSupabase = {
        invoice_number: nextNumber,
        customer_id: existing.customer_id,
        total: existing.total,
        discount: existing.discount || 0,
        discount_type: existing.discount_type || "percentage",
        deposit: existing.deposit || 0,
        status: "draft",
        invoice_date: new Date(),
        due_date: existing.due_date ? new Date(existing.due_date) : undefined,
        note: existing.note || "",
        address: existing.address || "",
        suburb: existing.suburb || "",
        state: existing.state || "",
        post_code: existing.post_code || "",
      };

      const items = (existing.invoice_items || []).map((item: any) => ({
        item_id: item.item_id,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        warehouse_id: item.warehouse_id || 1,
      }));

      const result = await invoicesRepo.createWithStockReduction(newInvoice, items);

      if (result.success) {
        openSnackbar({
          open: true,
          message: `Invoice duplicated as ${nextNumber}`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
        await getData();
      } else {
        throw new Error(result.error || "Failed to duplicate invoice");
      }
    } catch (error: any) {
      console.error("Error duplicating invoice:", error);
      openSnackbar({
        open: true,
        message: `Failed to duplicate invoice: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      removeActionLoadingId(invoiceId);
    }
  };

  const handleDeliveryStatusUpdate = async (status: string) => {
    if (!selectedInvoiceForDelivery) return;

    try {
      const invoicesRepo = new InvoicesRepository();
      const invoice: any = await invoicesRepo.getSingle(
        selectedInvoiceForDelivery,
      );
      if (!invoice?.invoiceData) {
        throw new Error("Invoice not found");
      }
      // extracting the ones that were joined
      const {
        customers,
        customer,
        invoice_items,
        quotations,
        id,
        ...restItems
      } = invoice?.invoiceData;
      console.log("COMING TILL HERE", restItems);
      const updatedInvoice = await invoicesRepo.edit(
        selectedInvoiceForDelivery,
        {
          ...restItems,
          delivery_status: status,
          updated_at: new Date().toISOString(),
        },
      );

      if (updatedInvoice) {
        openSnackbar({
          open: true,
          message: `Delivery status updated to ${status}`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
        await getData();
      } else {
        throw new Error("Failed to update delivery status");
      }
    } catch (error: any) {
      console.error("Error updating delivery status:", error);
      openSnackbar({
        open: true,
        message: `Failed to update delivery status: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      setDeliveryMenuAnchor(null);
      setSelectedInvoiceForDelivery(null);
    }
  };

  // Modal functions
  const openDeleteConfirmModal = () => setDeleteConfirmModalOpen(true);
  const closeDeleteConfirmModal = () => setDeleteConfirmModalOpen(false);
  const openFilterModal = () => setFilterModalOpen(true);
  const closeFilterModal = () => setFilterModalOpen(false);

  const onDelete = async () => {
    const invoicesRepo = new InvoicesRepository();
    const deletedInvoices = await invoicesRepo.delete(selected);
    if (deletedInvoices > 0) {
      openSnackbar({
        open: true,
        message: `${deletedInvoices} invoice(s) deleted successfully.`,
        variant: "alert",
        alert: { color: "success" },
      } as SnackbarProps);
      setSelected([]);
      await getData();
    } else {
      openSnackbar({
        open: true,
        message: "Invoice(s) could not be deleted. Please try again.",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }
  };

  // Check and update overdue invoices when component loads
  useEffect(() => {
    const checkOverdueInvoices = async () => {
      try {
        const invoicesRepo = new InvoicesRepository();
        const result = await invoicesRepo.updateOverdueInvoices();

        if (result.success && result.count > 0) {
          console.log(`✓ Updated ${result.count} overdue invoice(s)`);
        }
      } catch (error) {
        console.error('Error checking overdue invoices:', error);
      }
    };

    // Run overdue check before loading data
    checkOverdueInvoices().then(() => {
      getData();
    });
  }, [getData, order, orderBy, page, rowsPerPage, filters]);

  const getDataCsv = () => {
    try {
      let csvString =
        "Invoice Number,Customer,Total,Status,Delivery Status,Items Count,Due Date,Created Date,Note\n";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let invoice = data[i] as any;
          csvString += `"${invoice.invoice_number ?? ""}","${invoice.customer?.name ?? ""}",${invoice.total ?? ""},"${invoice.status ?? ""}","${invoice.delivery_status ?? "pending"}","${invoice.invoice_items?.length || 0}","${invoice.due_date ? getDateFormatted(invoice.due_date) : 'No due date'}","${getDateFormatted(invoice.created_at)}","${invoice.note ?? ""}"\n`;
        }

        setCsvData(csvString);

        setTimeout(() => {
          if (csvLink?.current?.link) {
            csvLink.current.link.click();
          }
        }, 2000);
      }
    } catch (e) {
      console.error("Error generating CSV:", e);
    }
  };

  const validateFilters = (values: any) => {
    const errors = {} as any;
    return errors;
  };

  const handleFiltersSubmit = (values: any) => {
    setFilters((prev: any) => ({
      ...prev,
      ...values,
    }));
    setFilterModalOpen(false);
  };

  const resetFilters = () => {
    setSearchValue("");
    setFilters({
      search: undefined,
      status: undefined,
      delivery_status: undefined,
      date_from: undefined,
      date_to: undefined,
      min_total: undefined,
      max_total: undefined,
    });
  };

  const updateDeliveryStatus = async (invoiceId: number, status: string) => {
    return handleDeliveryStatusUpdate(status);
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedInvoiceForStatus) return;

    try {
      const invoicesRepo = new InvoicesRepository();

      // Use the appropriate method based on status
      if (status === "paid") {
        // Route through email dialog first
        const row = data.find((inv: any) => inv.id === selectedInvoiceForStatus);
        setStatusMenuAnchor(null);
        setSelectedInvoiceForStatus(null);
        if (row) openEmailDialog("paid", row);
        return;
      } else if (status === "sent") {
        // Route through email dialog first
        const row = data.find((inv: any) => inv.id === selectedInvoiceForStatus);
        setStatusMenuAnchor(null);
        setSelectedInvoiceForStatus(null);
        if (row) openEmailDialog("sent", row);
        return;
      } else if (status === "cancelled") {
        const result = await invoicesRepo.cancelInvoice(selectedInvoiceForStatus);
        if (result?.success) {
          openSnackbar({
            open: true,
            message: `Invoice cancelled. Stock restored for ${result.restoredItems} items.`,
            variant: "alert",
            alert: { color: "success" },
          } as SnackbarProps);
          await getData();
        } else {
          throw new Error(result?.error || "Failed to cancel invoice");
        }
      } else {
        // For draft status, use updateStatus
        const result = await invoicesRepo.updateStatus(selectedInvoiceForStatus, status as any);
        if (result) {
          openSnackbar({
            open: true,
            message: `Invoice status updated to ${status}`,
            variant: "alert",
            alert: { color: "success" },
          } as SnackbarProps);
          await getData();
        } else {
          throw new Error("Failed to update status");
        }
      }
    } catch (error: any) {
      console.error("Error updating invoice status:", error);
      openSnackbar({
        open: true,
        message: `Failed to update status: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      setStatusMenuAnchor(null);
      setSelectedInvoiceForStatus(null);
    }
  };

  const updateInvoiceStatus = async (invoiceId: number, status: string) => {
    return handleStatusUpdate(status);
  };

  return {
    // State
    data,
    dataCount,
    loading,
    order,
    orderBy,
    selected,
    page,
    rowsPerPage,
    deleteConfirmModalOpen,
    filterModalOpen,
    filters,
    searchValue,
    csvData,
    csvLink,
    deliveryMenuAnchor,
    selectedInvoiceForDelivery,
    statusMenuAnchor,
    selectedInvoiceForStatus,

    // State setters
    setOrder,
    setOrderBy,
    setSelected,
    setPage,
    setRowsPerPage,
    setSearchValue,
    setDeliveryMenuAnchor,
    setStatusMenuAnchor,

    // Functions
    goToCreate,
    generateTableCells,
    onDelete,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    openFilterModal,
    closeFilterModal,
    handleFiltersSubmit,
    validateFilters,
    resetFilters,
    getDataCsv,
    handleSearchDebounced,
    markAsPaid,
    cancelInvoice,
    updateDeliveryStatus,
    updateInvoiceStatus,
    downloadInvoicePDF,
    downloadDeliveryNotePDF,
    markAsSent,
    resendEmail,
    viewItemsModal,

    // Components
    ItemsModal,
    PaymentMethodDialog,
    EmailDialog,

    // Constants
    headCells,
  };
}
