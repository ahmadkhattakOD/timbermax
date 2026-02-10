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
import InvoicesRepository from "utils/repositories/invoicesRepository";
import {
  generateAndDownloadInvoicePDF,
  generateDeliveryNotePDF,
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
import { Download, Send, Wallet, Eye, Truck, X } from "lucide-react";

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
    id: "invoice_date",
    numeric: false,
    disablePadding: true,
    label: "Invoice Date",
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
        unitPrice: parseFloat(item.unit_price) || 0,
        gst: item?.items?.gst || false,
        total: parseFloat(item.quantity) * parseFloat(item.unit_price) || 0,
      }));

      // compute grand total including GST (GST assumed 10% when item.gst is true)
      const includedTotal = formattedItems.reduce((acc: number, it: any) => {
        const base = Number(it.total) || 0;
        const gstAmt = it.gst ? base * 0.1 : 0;
        return acc + base + gstAmt;
      }, 0);

      setCurrentInvoiceItems(formattedItems);
      setCurrentInvoiceInfo({
        invoiceNumber: invoice.invoiceData.invoice_number,
        customerName: invoice.invoiceData.customer?.name,
        // overwrite total with GST-included total for display in the modal
        total: includedTotal,
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
    const canMarkPaid = row.status === "sent" || row.status === "draft";
    const canCancel = row.status !== "cancelled" && row.status !== "paid";
    const canMarkSent = row.status === "draft";
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
    };

    // Delivery status chip colors
    const deliveryColors: any = {
      packed: "info",
      shipped: "primary",
      delivered: "success",
      returned: "error",
      pending: "warning",
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
            label={
              row.delivery_status
                ? row.delivery_status.charAt(0).toUpperCase() +
                  row.delivery_status.slice(1)
                : "Pending"
            }
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
        <TableCell sx={{ minWidth: 120 }}>
          <Typography variant="body2">
            {getDateFormatted(row.invoice_date)}
          </Typography>
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
                    ${item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      {item.gst ? "Yes" : "No"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      ${item.total.toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell colSpan={6} align="right">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Grand Total:
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight={600}>
                    ${currentInvoiceInfo?.total?.toFixed(2) || "0.00"}
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

  // Action functions
  const markAsSent = async (invoiceId: number) => {
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
      console.error("Error marking invoice as sent:", error);
      openSnackbar({
        open: true,
        message: `Failed to mark as sent: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      removeActionLoadingId(invoiceId);
    }
  };

  const markAsPaid = async (invoiceId: number) => {
    // Open payment method dialog instead of directly marking as paid
    setSelectedInvoiceForPayment(invoiceId);
    setSelectedPaymentMethod("");
    setCustomPaymentMethod("");
    setPaymentMethodDialogOpen(true);
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

  useEffect(() => {
    getData();
  }, [getData, order, orderBy, page, rowsPerPage, filters]);

  const getDataCsv = () => {
    try {
      let csvString =
        "Invoice Number,Customer,Total,Status,Delivery Status,Items Count,Invoice Date,Created Date,Note\n";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let invoice = data[i] as any;
          csvString += `"${invoice.invoice_number ?? ""}","${invoice.customer?.name ?? ""}",${invoice.total ?? ""},"${invoice.status ?? ""}","${invoice.delivery_status ?? "pending"}","${invoice.invoice_items?.length || 0}","${getDateFormatted(invoice.invoice_date)}","${getDateFormatted(invoice.created_at)}","${invoice.note ?? ""}"\n`;
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
        // Close status menu and open payment method dialog
        setStatusMenuAnchor(null);
        setSelectedInvoiceForPayment(selectedInvoiceForStatus);
        setSelectedInvoiceForStatus(null);
        setSelectedPaymentMethod("");
        setCustomPaymentMethod("");
        setPaymentMethodDialogOpen(true);
        return; // Exit early, payment will be confirmed in dialog
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
        // For draft and sent status, use updateStatus
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
    viewItemsModal,

    // Components
    ItemsModal,
    PaymentMethodDialog,

    // Constants
    headCells,
  };
}
