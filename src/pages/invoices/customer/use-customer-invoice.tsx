import { useState, useEffect, useRef, useCallback } from "react";
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
} from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import {
  getDateFormatted,
  initialRowsPerPage,
  useDebouncedSearch,
  formatAmount,
  roundAmount,
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
import {
  Download,
  Send,
  Wallet,
  Eye,
  Truck,
  X,
} from "lucide-react";
import CustomersRepository from "utils/repositories/customersRepository";

// Head cells for the table - Simplified for customer view
const headCells: HeadCell[] = [
  {
    id: "invoice_number",
    numeric: false,
    disablePadding: true,
    label: "Invoice Number",
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
    id: "invoice_date",
    numeric: false,
    disablePadding: true,
    label: "Invoice Date",
  },
  {
    id: "created_at",
    numeric: false,
    disablePadding: true,
    label: "Created Date",
  },
  {
    id: "actions",
    numeric: false,
    disablePadding: true,
    label: "Actions",
  },
];

// Filter type for customer invoices
interface ValuesFilterCustomerInvoices {
  invoice_number: string;
  minimumTotal: string;
  maximumTotal: string;
  status: string;
  delivery_status: string;
  invoice_date_from: string;
  invoice_date_to: string;
  created_at_from: string;
  created_at_to: string;
}

export const initialFilters: ValuesFilterCustomerInvoices = {
  invoice_number: "",
  minimumTotal: "",
  maximumTotal: "",
  status: "",
  delivery_status: "",
  invoice_date_from: "",
  invoice_date_to: "",
  created_at_from: "",
  created_at_to: "",
};

export function useCustomerInvoices(customerId: number) {
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
  const [filters, setFilters] = useState<ValuesFilterCustomerInvoices>(initialFilters);
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

  // Function to fetch customer name
  async function fetchCustomerName(id: number) {
    try {
      const customersRepo = new CustomersRepository();
      const customer = await customersRepo.getSingle(id);
      if (customer?.customerData) {
        return customer.customerData.name;
      }
      return "Unknown Customer";
    } catch (error) {
      console.error("Error fetching customer:", error);
      return "Unknown Customer";
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev: ValuesFilterCustomerInvoices) => ({
      ...prev,
      invoice_number: value,
    }));
    setPage(0);
  };

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

  // View items modal - EXACTLY LIKE ORIGINAL
  const viewItemsModal = async (invoiceId: number) => {
    try {
      const invoicesRepo = new InvoicesRepository();
      const invoice: any = await invoicesRepo.getSingle(invoiceId);

      if (!invoice?.invoiceData) {
        openSnackbar({
          open: true,
          message: "Invoice not found.",
          variant: "alert",
          alert: { color: "error" as any },
        } as SnackbarProps);
        return;
      }

      const items = invoice.invoiceData.invoice_items || [];

      if (items.length === 0) {
        openSnackbar({
          open: true,
          message: "No items found in this invoice.",
          variant: "alert",
          alert: { color: "info" as any },
        } as SnackbarProps);
        return;
      }

      const formattedItems = items.map((item: any, index: number) => ({
        id: index + 1,
        name: item.item_name ?? item.items?.name ?? "Unknown",
        code: item.item_code ?? item.items?.itemCode ?? "N/A",
        quantity: roundAmount(item.quantity),
        unitPrice: parseFloat(item.unit_price) || 0,
        gst: item.item_gst ?? item?.items?.gst ?? false,
        total: roundAmount(parseFloat(item.quantity) * parseFloat(item.unit_price) || 0),
      }));

      setCurrentInvoiceItems(formattedItems);
      setCurrentInvoiceInfo({
        invoiceNumber: invoice.invoiceData.invoice_number,
        customerName: invoice.invoiceData.customer?.name,
        total: invoice.invoiceData.total,
      });
      setItemsModalOpen(true);
    } catch (error: any) {
      console.error("Error viewing invoice items:", error);
      openSnackbar({
        open: true,
        message: `Failed to load invoice items: ${error.message}`,
        variant: "alert",
        alert: { color: "error" as any },
      } as SnackbarProps);
    }
  };

  const closeItemsModal = () => {
    setItemsModalOpen(false);
    setCurrentInvoiceItems([]);
    setCurrentInvoiceInfo(null);
  };

  // PDF Download functions - EXACTLY LIKE ORIGINAL
  const downloadInvoicePDF = useCallback(async (invoiceId: number) => {
    try {
      setLoading(true);
      const invoicesRepo = new InvoicesRepository();
      const invoiceResponse: any = await invoicesRepo.getSingle(invoiceId);

      if (!invoiceResponse?.invoiceData) {
        throw new Error(`Invoice with ID ${invoiceId} not found`);
      }

      openSnackbar({
        open: true,
        message: "Generating Invoice PDF...",
        variant: "alert",
        alert: { color: "info" as any },
      } as SnackbarProps);

      const result = await generateAndDownloadInvoicePDF(
        invoiceResponse.invoiceData
      );

      if (result.success) {
        openSnackbar({
          open: true,
          message: `Invoice PDF downloaded: ${result.fileName}`,
          variant: "alert",
          alert: { color: "success" as any },
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
        alert: { color: "error" as any },
      } as SnackbarProps);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadDeliveryNotePDF = useCallback(async (invoiceId: number) => {
    try {
      setLoading(true);
      const invoicesRepo = new InvoicesRepository();
      const invoiceResponse: any = await invoicesRepo.getSingle(invoiceId);

      if (!invoiceResponse?.invoiceData) {
        throw new Error(`Invoice with ID ${invoiceId} not found`);
      }

      openSnackbar({
        open: true,
        message: "Generating Delivery Note...",
        variant: "alert",
        alert: { color: "info" as any },
      } as SnackbarProps);

      const result = await generateDeliveryNotePDF(invoiceResponse.invoiceData);

      if (result.success) {
        openSnackbar({
          open: true,
          message: `Delivery Note downloaded: ${result.fileName}`,
          variant: "alert",
          alert: { color: "success" as any },
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
        alert: { color: "error" as any },
      } as SnackbarProps);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate table cells with all actions - ADAPTED FOR CUSTOMER VIEW
  const generateTableCells = (
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) => {
    const itemsCount = row.invoice_items?.length || 0;
    const canMarkPaid = row.status === "sent" || row.status === "draft";
    const canCancel = row.status !== "cancelled" && row.status !== "paid";
    const canMarkSent = row.status === "draft";
    const canUpdateDelivery = row.status !== "cancelled";
    const canDownloadPDF = row.status !== "cancelled";
    const canDownloadDeliveryNote =
      row.delivery_status &&
      ["packed", "shipped", "delivered", "pick_up"].includes(row.delivery_status);

    // Status chip colors
    const statusColors: any = {
      draft: "warning",
      sent: "info",
      paid: "primary",
      cancelled: "error",
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
        <TableCell align="right" sx={{ minWidth: 120 }}>
          <Typography fontWeight={600}>${formatAmount(row.total)}</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Chip
            label={row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
            color={statusColors[row.status] || "default"}
            size="small"
            sx={{ fontWeight: 600 }}
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
        <TableCell sx={{ minWidth: 120 }}>
          <Typography variant="body2">
            {getDateFormatted(row.invoice_date)}
          </Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Typography variant="body2">
            {getDateFormatted(row.created_at)}
          </Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 300 }}>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {/* Download Invoice PDF */}
            {canDownloadPDF && (
              <Tooltip title="Download Invoice PDF">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadInvoicePDF(row.id);
                  }}
                  color="primary"
                >
                  <Download size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* Download Delivery Note */}
            {canDownloadDeliveryNote && (
              <Tooltip title="Download Delivery Note">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadDeliveryNotePDF(row.id);
                  }}
                  color="warning"
                >
                  <Truck size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* View Items */}
            {itemsCount > 0 && (
              <Tooltip title="View Items">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    viewItemsModal(row.id);
                  }}
                  color="info"
                >
                  <Eye size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* Mark as Sent */}
            {canMarkSent && (
              <Tooltip title="Mark as Sent">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsSent(row.id);
                  }}
                  color="info"
                >
                  <Send size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* Mark as Paid */}
            {canMarkPaid && (
              <Tooltip title="Mark as Paid">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsPaid(row.id);
                  }}
                  color="success"
                >
                  <Wallet size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* Cancel Invoice */}
            {canCancel && (
              <Tooltip title="Cancel Invoice">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelInvoice(row.id);
                  }}
                  color="error"
                >
                  <X size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      </>
    );
  };

  // Items modal component - EXACTLY LIKE ORIGINAL
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
                    {formatAmount(item.quantity)}
                  </TableCell>
                  <TableCell align="right">
                    ${formatAmount(item.unitPrice)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      {item.gst ? "Yes" : "No"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      ${formatAmount(item.total)}
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
                    ${formatAmount(currentInvoiceInfo?.total)}
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
                (inv) => inv.invoice_number === currentInvoiceInfo.invoiceNumber
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

  // Action functions - EXACTLY LIKE ORIGINAL
  const markAsSent = async (invoiceId: number) => {
    try {
      const invoicesRepo = new InvoicesRepository();
      const result = await invoicesRepo.updateStatus(invoiceId, "sent");

      if (result) {
        openSnackbar({
          open: true,
          message: "Invoice marked as sent",
          variant: "alert",
          alert: { color: "success" as any },
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
        alert: { color: "error" as any },
      } as SnackbarProps);
    }
  };

  const markAsPaid = async (invoiceId: number) => {
    try {
      const invoicesRepo = new InvoicesRepository();
      const result = await invoicesRepo.markAsPaid(invoiceId);

      if (result) {
        openSnackbar({
          open: true,
          message: "Invoice marked as paid",
          variant: "alert",
          alert: { color: "success" as any },
        } as SnackbarProps);
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
        alert: { color: "error" as any },
      } as SnackbarProps);
    }
  };

  const cancelInvoice = async (invoiceId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this invoice? This will restore stock."
      )
    ) {
      return;
    }

    try {
      const invoicesRepo = new InvoicesRepository();
      const result = await invoicesRepo.cancelInvoice(invoiceId);

      if (result?.success) {
        openSnackbar({
          open: true,
          message: `Invoice cancelled. Stock restored for ${result.restoredItems} items.`,
          variant: "alert",
          alert: { color: "success" as any },
        } as SnackbarProps);
        await getData();
      } else {
        openSnackbar({
          open: true,
          message: `Failed to cancel invoice: ${result?.error}`,
          variant: "alert",
          alert: { color: "error" as any },
        } as SnackbarProps);
      }
    } catch (error: any) {
      console.error("Error cancelling invoice:", error);
      openSnackbar({
        open: true,
        message: `Failed to cancel invoice: ${error.message}`,
        variant: "alert",
        alert: { color: "error" as any },
      } as SnackbarProps);
    }
  };

  const updateDeliveryStatus = async (invoiceId: number, status: string) => {
    try {
      const invoicesRepo = new InvoicesRepository();
      const invoice: any = await invoicesRepo.getSingle(invoiceId);
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
      
      const updatedInvoice = await invoicesRepo.edit(
        invoiceId,
        {
          ...restItems,
          delivery_status: status,
          updated_at: new Date().toISOString(),
        }
      );

      if (updatedInvoice) {
        openSnackbar({
          open: true,
          message: `Delivery status updated to ${status}`,
          variant: "alert",
          alert: { color: "success" as any },
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
        alert: { color: "error" as any },
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
        alert: { color: "success" as any },
      } as SnackbarProps);
      setSelected([]);
      await getData();
    } else {
      openSnackbar({
        open: true,
        message: "Invoice(s) could not be deleted. Please try again.",
        variant: "alert",
        alert: { color: "error" as any },
      } as SnackbarProps);
    }
  };

  // Data fetching - USING getByCustomer METHOD
  const getData = async () => {
    try {
      if (!customerId) return;

      setLoading(true);
      const invoicesRepo = new InvoicesRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;

      const invoices = await invoicesRepo.getByCustomer(
        customerId,
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters as any
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
      console.error("Error fetching customer invoices:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [customerId, order, orderBy, page, rowsPerPage, filters]);

  const getDataCsv = () => {
    try {
      let csvString =
        "Invoice Number,Total,Status,Delivery Status,Items Count,Invoice Date,Created Date,Note\n";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let invoice = data[i] as any;
          csvString += `"${invoice.invoice_number ?? ""}",${formatAmount(invoice.total)},"${invoice.status ?? ""}","${invoice.delivery_status ?? "pending"}","${invoice.invoice_items?.length || 0}","${getDateFormatted(invoice.invoice_date)}","${getDateFormatted(invoice.created_at)}","${invoice.note ?? ""}"\n`;
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

  const validateFilters = (values: ValuesFilterCustomerInvoices) => {
    const errors = {} as any;
    return errors;
  };

  const handleFiltersSubmit = (values: ValuesFilterCustomerInvoices) => {
    setFilters(values);
    setPage(0);
    setFilterModalOpen(false);
  };

  const resetFilters = () => {
    setSearchValue("");
    setFilters(initialFilters);
    setPage(0);
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

    // State setters
    setOrder,
    setOrderBy,
    setSelected,
    setPage,
    setRowsPerPage,
    setSearchValue,
    setDeliveryMenuAnchor,

    // Functions
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
    downloadInvoicePDF,
    downloadDeliveryNotePDF,
    markAsSent,
    viewItemsModal,
    fetchCustomerName,

    // Components
    ItemsModal,

    // Constants
    headCells,
  };
}