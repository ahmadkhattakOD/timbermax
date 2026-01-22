// hooks/useQuotations.ts (UPDATED - Corrected snackbar typings)
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
} from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import {
  AddCircle,
  CloseCircle,
  DocumentDownload,
  Edit,
  Eye,
  EyeSlash,
  Receipt,
  Send,
  Truck,
  Xd,
} from "iconsax-react";
import {
  generateAndDownloadDeliveryDocument,
  generateAndDownloadQuotationPDF,
  openQuotationPDFInNewTab,
} from "utils/quotation-pdf-generator";
import { Quotation } from "types";
import {
  getDateFormatted,
  initialRowsPerPage,
  useDebouncedSearch,
} from "utils/helpers";
import QuotationsRepository from "utils/repositories/quotationRepo";
import { ValuesFilterQuotations } from "types";
import StocksRepository from "utils/repositories/stocksRepository";
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
// Add these missing icon imports
// import { Download, Visibility, Close, Receipt } from "@mui/icons-material";
import { SnackbarProps } from "types/snackbar";

const headCells: HeadCell[] = [
  {
    id: "quotation_number",
    numeric: false,
    disablePadding: true,
    label: "Quotation Number",
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
    id: "actions",
    numeric: false,
    disablePadding: true,
    label: "Actions",
  },
];

async function downloadDeliveryDocument(quotationId: number) {
  try {
    const quotationsRepo = new QuotationsRepository();
    const quotationResponse = await quotationsRepo.getSingle(quotationId);

    if (!quotationResponse?.quotationData) {
      throw new Error(`Quotation with ID ${quotationId} not found`);
    }

    const quotation: Quotation = quotationResponse.quotationData;

    openSnackbar({
      action: false,
      open: true,
      message: "Generating Delivery Document...",
      anchorOrigin: { vertical: "bottom", horizontal: "right" },
      variant: "alert",
      alert: {
        color: "info" as any,
        variant: "filled",
      },
      transition: "Fade",
      close: true,
      actionButton: false,
    } as SnackbarProps);

    const result = await generateAndDownloadDeliveryDocument(quotation);

    if (result.success) {
      openSnackbar({
        action: false,
        open: true,
        message: `Delivery Document downloaded: ${result.fileName}`,
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "success" as any,
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
    } else {
      throw new Error(result.error || "Failed to download Delivery Document");
    }
  } catch (error) {
    console.error("Error in downloadDeliveryDocument:", error);
    openSnackbar({
      action: false,
      open: true,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate Delivery Document",
      anchorOrigin: { vertical: "bottom", horizontal: "right" },
      variant: "alert",
      alert: {
        color: "error" as any,
        variant: "filled",
      },
      transition: "Fade",
      close: true,
      actionButton: false,
    } as SnackbarProps);
  } finally {
  }
}
export const initialFilters: ValuesFilterQuotations = {
  quotation_number: "",
  customer_name: "",
  minimumTotal: "",
  maximumTotal: "",
  status: "",
  created_at_from: "",
  created_at_to: "",
  item_name: "",
  item_code: "",
};

export function useQuotations() {
  const [data, setData] = useState<Quotation[]>([]);
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
  const [currentQuotationItems, setCurrentQuotationItems] = useState<any[]>([]);
  const [currentQuotationInfo, setCurrentQuotationInfo] = useState<any>(null);
  const [filters, setFilters] =
    useState<ValuesFilterQuotations>(initialFilters);
  const [searchValue, setSearchValue] = useState("");
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const navigate = useNavigate();
  const theme = useTheme();

  function goToCreate() {
    navigate("/quotations/create");
  }

  // function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
  //   let temp = { ...filters };
  //   temp.quotation_number = e.target.value;
  //   temp.customer_name = e.target.value;
  //   setFilters(temp);
  // }
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    setFilters((prev) => ({
      ...prev,
      quotation_number: value,
    }));
  }

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);
  // Add this function to show items in a modal
  async function viewItemsModal(quotationId: number) {
    try {
      const quotationsRepo = new QuotationsRepository();
      const quotation = await quotationsRepo.getSingle(quotationId);

      if (!quotation?.quotationData) {
        openSnackbar({
          action: false,
          open: true,
          message: "Quotation not found.",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error" as any,
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
        return;
      }

      const items = quotation.quotationData.quotation_items || [];

      if (items.length === 0) {
        openSnackbar({
          action: false,
          open: true,
          message: "No items found in this quotation.",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "info" as any,
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
        return;
      }

      // Format items for display
      const formattedItems = items.map((item: any, index: number) => ({
        id: index + 1,
        name: item.items?.name || "Unknown",
        code: item.items?.itemCode || "N/A",
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unit_price) || 0,
        total: parseFloat(item.quantity) * parseFloat(item.unit_price) || 0,
      }));

      setCurrentQuotationItems(formattedItems);
      setCurrentQuotationInfo({
        quotationNumber: quotation.quotationData.quotation_number,
        customerName: quotation.quotationData.customers?.name,
        total: quotation.quotationData.total,
      });
      setItemsModalOpen(true);
    } catch (error: any) {
      console.error("Error viewing quotation items:", error);
      openSnackbar({
        action: false,
        open: true,
        message: `Failed to load quotation items: ${error.message}`,
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "error" as any,
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
    }
  }

  // Add function to close the items modal
  function closeItemsModal() {
    setItemsModalOpen(false);
    setCurrentQuotationItems([]);
    setCurrentQuotationInfo(null);
  }

  // Add this component to your return statement at the bottom
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
            Quotation Items
          </Typography>
          {currentQuotationInfo && (
            <Typography variant="body2" color="text.secondary">
              {currentQuotationInfo.quotationNumber} -{" "}
              {currentQuotationInfo.customerName}
            </Typography>
          )}
        </Box>
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
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentQuotationItems.map((item) => (
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
                      ${item.total.toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell colSpan={5} align="right">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Grand Total:
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight={600}>
                    ${currentQuotationInfo?.total?.toFixed(2) || "0.00"}
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
        <Button onClick={closeItemsModal} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Update the generateTableCells function to add Delivery Document button
  function generateTableCells(
    row: Quotation,
    labelId: string,
    isItemSelected: boolean
  ) {
    const itemsCount = row.quotation_items?.length || 0;
    const isConvertable = row.status === "approved";
    const isCancellable =
      row.status !== "cancelled" && row.status !== "converted";
    const canMarkSent = row.status === "draft";
    const canMarkApproved = row.status === "sent";
    const canDownloadDelivery = ["approved", "sent", "draft"].includes(
      row.status || ""
    );

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
          sx={{ minWidth: 200 }}
          align="left"
        >
          {row.quotation_number}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.customer?.name}</TableCell>
        <TableCell align="right" sx={{ minWidth: 150 }}>
          ${row.total?.toFixed(2)}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <Typography
            sx={{
              color:
                row.status === "approved"
                  ? theme.palette.success.main
                  : row.status === "sent"
                    ? theme.palette.info.main
                    : row.status === "draft"
                      ? theme.palette.warning.main
                      : row.status === "converted"
                        ? theme.palette.primary.main
                        : theme.palette.error.main,
              fontWeight: 600,
            }}
          >
            {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
          </Typography>
        </TableCell>

        <TableCell align="center" sx={{ minWidth: 100 }}>
          {itemsCount}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {row.note || "-"}
        </TableCell>
        <TableCell sx={{ minWidth: 350 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {/* Mark as Sent Button (only for draft) */}
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

            {/* Mark as Approved Button (only for sent) */}
            {canMarkApproved && (
              <Tooltip title="Mark as Approved">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsApproved(row.id);
                  }}
                  color="success"
                >
                  <AddCircle size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* View Items Button - Always show if there are items */}
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

            {/* Download PDF Button */}
            <Tooltip title="Download Quotation PDF">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadQuotationPDF(row.id);
                }}
                color="primary"
              >
                <DocumentDownload size={18} />
              </IconButton>
            </Tooltip>

            {/* Download Delivery Document Button */}
            {canDownloadDelivery && itemsCount > 0 && (
              <Tooltip title="Download Delivery Document">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadDeliveryDocument(row.id);
                  }}
                  color="warning"
                >
                  <Truck size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* Convert to Invoice Button (only for approved quotations) */}
            {isConvertable && (
              <Tooltip title="Convert to Invoice">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    convertToInvoice(row.id);
                  }}
                  color="success"
                >
                  <Receipt size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* Cancel Button (only for non-cancelled quotations) */}
            {isCancellable && (
              <Tooltip title="Cancel Quotation">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelQuotation(row.id);
                  }}
                  color="error"
                >
                  <CloseCircle size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      </>
    );
  }
  // Add new functions to useQuotations hook
  async function markAsSent(quotationId: number) {
    try {
      const quotationsRepo = new QuotationsRepository();
      const result = await quotationsRepo.updateStatus(quotationId, "sent");

      if (result.success) {
        openSnackbar({
          action: false,
          open: true,
          message: "Quotation marked as sent",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "success",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
        await getData();
      } else {
        openSnackbar({
          action: false,
          open: true,
          message: `Failed to mark as sent: ${result.error}`,
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
      }
    } catch (error: any) {
      console.error("Error marking quotation as sent:", error);
      openSnackbar({
        action: false,
        open: true,
        message: `Failed to mark as sent: ${error.message}`,
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "error",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
    }
  }

  async function markAsApproved(quotationId: number) {
    try {
      const quotationsRepo = new QuotationsRepository();
      const result = await quotationsRepo.updateStatus(quotationId, "approved");

      if (result.success) {
        openSnackbar({
          action: false,
          open: true,
          message: "Quotation marked as approved",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "success",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
        await getData();
      } else {
        openSnackbar({
          action: false,
          open: true,
          message: `Failed to mark as approved: ${result.error}`,
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
      }
    } catch (error: any) {
      console.error("Error marking quotation as approved:", error);
      openSnackbar({
        action: false,
        open: true,
        message: `Failed to mark as approved: ${error.message}`,
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "error",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
    }
  }

  // Update cancelQuotation function
  async function cancelQuotation(quotationId: number) {
    if (
      !window.confirm(
        "Are you sure you want to cancel this quotation? This will release any reserved stock."
      )
    ) {
      return;
    }

    try {
      const quotationsRepo = new QuotationsRepository();
      const result = await quotationsRepo.updateStatus(
        quotationId,
        "cancelled"
      );

      if (result.success) {
        openSnackbar({
          action: false,
          open: true,
          message: "Quotation cancelled successfully",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "success",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
        await getData();
      } else {
        openSnackbar({
          action: false,
          open: true,
          message: `Failed to cancel quotation: ${result.error}`,
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
      }
    } catch (error: any) {
      console.error("Error cancelling quotation:", error);
      openSnackbar({
        action: false,
        open: true,
        message: `Failed to cancel quotation: ${error.message}`,
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "error",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
    }
  }

  function openDeleteConfirmModal() {
    setDeleteConfirmModalOpen(true);
  }

  async function onDelete() {
    const quotationsRepo = new QuotationsRepository();
    const deletedQuotations = await quotationsRepo.delete(selected);
    if (deletedQuotations > 0) {
      openSnackbar({
        action: false,
        open: true,
        message: `${deletedQuotations} quotation(s) deleted successfully.`,
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "success",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
      setSelected([]);
      await getData();
    } else {
      openSnackbar({
        action: false,
        open: true,
        message:
          "Quotation(s) could not be deleted successfully. Please try again.",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "error",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
    }
  }

  function closeDeleteConfirmModal() {
    setDeleteConfirmModalOpen(false);
  }

  function openFilterModal() {
    setFilterModalOpen(true);
  }

  function closeFilterModal() {
    setFilterModalOpen(false);
  }

  async function getData() {
    try {
      setLoading(true);
      const quotationsRepo = new QuotationsRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const quotations = await quotationsRepo.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters
      );
      if (quotations) {
        const { quotationsData, quotationsCount, quotationsError } = quotations;
        if (quotationsData && !quotationsError) {
          setData(quotationsData);
          setDataCount(quotationsCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching quotations:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters]);

  function getDataCsv() {
    try {
      let csvString =
        "Quotation Number,Customer,Total,Status,Items Count,Created Date,Note\n";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let quotation = data[i] as any;
          csvString += `"${quotation.quotation_number ?? ""}","${quotation.customer?.name ?? ""}",${quotation.total ?? ""},"${quotation.status ?? ""}","${quotation.valid_until ? getDateFormatted(quotation.valid_until) : ""}",${quotation.quotation_items?.length || 0},"${getDateFormatted(quotation.created_at)}","${quotation.note ?? ""}"\n`;
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
  }

  async function validateFilters(values: ValuesFilterQuotations) {
    const errors = {} as ValuesFilterQuotations;
    return errors;
  }

  async function handleFiltersSubmit(values: ValuesFilterQuotations) {
    try {
      setFilters(values);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering quotations:", error);
    }
  }

  function resetFilters() {
    setSearchValue("");
    setFilters(initialFilters);
  }

  // PDF Download function - FIXED SNACKBAR TYPES
  const downloadQuotationPDF = useCallback(
    async (quotationId: number): Promise<void> => {
      try {
        setLoading(true);

        const quotationsRepo = new QuotationsRepository();
        const quotationResponse = await quotationsRepo.getSingle(quotationId);

        if (!quotationResponse?.quotationData) {
          throw new Error(`Quotation with ID ${quotationId} not found`);
        }

        const quotation: Quotation = quotationResponse.quotationData;

        // Show loading notification - FIXED: Using correct snackbar parameters
        openSnackbar({
          action: false,
          open: true,
          message: "Generating PDF...",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "info" as
              | "success"
              | "info"
              | "warning"
              | "error"
              | "primary"
              | "secondary",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);

        // Generate and download PDF
        const result = await generateAndDownloadQuotationPDF(quotation);

        if (result.success) {
          openSnackbar({
            action: false,
            open: true,
            message: `PDF downloaded: ${result.fileName}`,
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            variant: "alert",
            alert: {
              color: "success" as
                | "success"
                | "info"
                | "warning"
                | "error"
                | "primary"
                | "secondary",
              variant: "filled",
            },
            transition: "Fade",
            close: true,
            actionButton: false,
          } as SnackbarProps);
        } else {
          throw new Error(result.error || "Failed to download PDF");
        }
      } catch (error) {
        console.error("Error in downloadQuotationPDF:", error);

        openSnackbar({
          action: false,
          open: true,
          message:
            error instanceof Error ? error.message : "Failed to generate PDF",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error" as
              | "success"
              | "info"
              | "warning"
              | "error"
              | "primary"
              | "secondary",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // PDF Preview function - FIXED SNACKBAR TYPES
  const previewQuotationPDF = useCallback(
    async (quotationId: number): Promise<void> => {
      try {
        const quotationsRepo = new QuotationsRepository();
        const quotationResponse = await quotationsRepo.getSingle(quotationId);

        if (!quotationResponse?.quotationData) {
          throw new Error(`Quotation with ID ${quotationId} not found`);
        }

        const quotation: Quotation = quotationResponse.quotationData;

        openSnackbar({
          action: false,
          open: true,
          message: "Opening PDF preview...",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "info" as
              | "success"
              | "info"
              | "warning"
              | "error"
              | "primary"
              | "secondary",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);

        await openQuotationPDFInNewTab(quotation);
      } catch (error) {
        console.error("Error in previewQuotationPDF:", error);

        openSnackbar({
          action: false,
          open: true,
          message:
            error instanceof Error ? error.message : "Failed to preview PDF",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error" as
              | "success"
              | "info"
              | "warning"
              | "error"
              | "primary"
              | "secondary",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
      }
    },
    []
  );

  // Convert quotation to invoice - FIXED SNACKBAR TYPES
  async function convertToInvoice(quotationId: number) {
    try {
      const quotationsRepo = new QuotationsRepository();
      const quotation = await quotationsRepo.getSingle(quotationId);
      if (!quotation?.quotationData) {
        openSnackbar({
          action: false,
          open: true,
          message: "Quotation not found.",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error" as
              | "success"
              | "info"
              | "warning"
              | "error"
              | "primary"
              | "secondary",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
        return;
      }

      // Navigate to invoice creation with quotation data
      navigate(`/invoices/create?quotation_id=${quotationId}`);

      openSnackbar({
        action: false,
        open: true,
        message: "Redirecting to create invoice from quotation...",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "info" as
            | "success"
            | "info"
            | "warning"
            | "error"
            | "primary"
            | "secondary",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
    } catch (error: any) {
      console.error("Error converting quotation to invoice:", error);
      openSnackbar({
        action: false,
        open: true,
        message: `Failed to convert quotation to invoice: ${error.message}`,
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "error" as
            | "success"
            | "info"
            | "warning"
            | "error"
            | "primary"
            | "secondary",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
    }
  }

  // View quotation items - FIXED SNACKBAR TYPES
  async function viewItems(quotationId: number) {
    try {
      const quotationsRepo = new QuotationsRepository();
      const quotation = await quotationsRepo.getSingle(quotationId);

      if (!quotation?.quotationData) {
        openSnackbar({
          action: false,
          open: true,
          message: "Quotation not found.",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error" as
              | "success"
              | "info"
              | "warning"
              | "error"
              | "primary"
              | "secondary",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
        return;
      }

      // Show items in a modal or navigate to a view page
      const items = quotation.quotationData.quotation_items || [];

      if (items.length === 0) {
        openSnackbar({
          action: false,
          open: true,
          message: "No items found in this quotation.",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "info" as
              | "success"
              | "info"
              | "warning"
              | "error"
              | "primary"
              | "secondary",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
        } as SnackbarProps);
        return;
      }

      // Create a message with all items
      let itemsMessage = "Items in this quotation:\n\n";
      items.forEach((item: any, index: number) => {
        itemsMessage += `${index + 1}. ${item.items?.name || "Unknown"} (${item.items?.itemCode || "N/A"})\n`;
        itemsMessage += `   Quantity: ${item.quantity}\n`;
        itemsMessage += `   Unit Price: $${item.unit_price?.toFixed(2) || "0.00"}\n`;
        itemsMessage += `   Total: $${item.total_price?.toFixed(2) || "0.00"}\n\n`;
      });

      // Show items in an alert (you can replace this with a custom modal)
      alert(itemsMessage);
    } catch (error: any) {
      console.error("Error viewing quotation items:", error);
      openSnackbar({
        action: false,
        open: true,
        message: `Failed to load quotation items: ${error.message}`,
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "error" as
            | "success"
            | "info"
            | "warning"
            | "error"
            | "primary"
            | "secondary",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
      } as SnackbarProps);
    }
  }

  // Return ALL functions and state
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

    // State setters
    setOrder,
    setOrderBy,
    setSelected,
    setPage,
    setRowsPerPage,
    setSearchValue,

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
    convertToInvoice,
    viewItems,
    cancelQuotation,
    downloadQuotationPDF,
    previewQuotationPDF,
    ItemsModal,
    // Constants
    headCells,
  };
}
