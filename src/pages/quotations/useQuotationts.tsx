// hooks/useQuotations.ts (UPDATED - Corrected snackbar typings)
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
  Chip,
  CircularProgress,
  TextField,
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
import { X, Download, Send as SendIcon, Code, RotateCcw, Copy, Printer } from "lucide-react";
import {
  generateAndDownloadDeliveryDocument,
  generateAndDownloadQuotationPDF,
  generateQuotationPDFBase64,
  openQuotationPDFInNewTab,
  printQuotationPDF,
  printQuotationDeliveryNote,
} from "utils/quotation-pdf-generator";
import emailjs from "@emailjs/browser";
import { Quotation } from "types";
import {
  getDateFormatted,
  initialRowsPerPage,
  useDebouncedSearch,
  formatAmount,
  roundAmount,
} from "utils/helpers";
import QuotationsRepository, { QuotationSupabase } from "utils/repositories/quotationRepo";
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
import {
  calculateItemTotal,
  calculateTotalBreakdown,
  formatCurrency,
} from "utils/calculateTotals";

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
    id: "actions",
    numeric: false,
    disablePadding: true,
    label: "Actions",
  },
  {
    id: "note",
    numeric: false,
    disablePadding: true,
    label: "Note",
  },
  {
    id: "created_at",
    numeric: false,
    disablePadding: true,
    label: "Date Created",
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
  valid_until_from: "",
  valid_until_to: "",
  item_name: "",
  item_code: "",
};

const MANDATORY_QUOTATION_CC = "info@timbermax.com.au";

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

  // Quotation status menu state
  const [statusMenuAnchor, setStatusMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [selectedQuotationForStatus, setSelectedQuotationForStatus] = useState<
    number | null
  >(null);

  // Print menu state
  const [printMenuAnchor, setPrintMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedQuotationForPrint, setSelectedQuotationForPrint] = useState<number | null>(null);

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailQuotationData, setEmailQuotationData] = useState<any>(null);
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
  const [emailIsResend, setEmailIsResend] = useState(false);

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
    setPage(0);
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
        name: (item.item_name ?? item.items?.name) || "Unknown",
        code: (item.item_code ?? item.items?.itemCode) || "N/A",
        quantity: roundAmount(item.quantity),
        unit_price: roundAmount(item.unit_price),
        gst: (item.item_gst ?? item?.items?.gst) || false,
      }));

      // Calculate totals using utility function
      const discount = parseFloat(quotation.quotationData.discount) || 0;
      const discountType = quotation.quotationData.discount_type || "percentage";
      const breakdown = calculateTotalBreakdown(formattedItems, discount, discountType);

      setCurrentQuotationItems(formattedItems);
      setCurrentQuotationInfo({
        quotationNumber: quotation.quotationData.quotation_number,
        customerName: quotation.quotationData.customers?.name,
        breakdown,
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
              {currentQuotationItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell align="right">
                    {formatAmount(item.quantity)}
                  </TableCell>
                  <TableCell align="right">
                    ${formatAmount(item.unit_price)}
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
                    {formatCurrency(currentQuotationInfo?.breakdown?.subtotal || 0)}
                  </Typography>
                </TableCell>
              </TableRow>

              {/* GST Row */}
              {currentQuotationInfo?.breakdown?.gstAmount > 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="right">
                    <Typography>GST (10%):</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>
                      {formatCurrency(currentQuotationInfo.breakdown.gstAmount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Discount Row */}
              {currentQuotationInfo?.breakdown?.discountAmount > 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="right">
                    <Typography>
                      {currentQuotationInfo.breakdown.discountType === "fixed"
                        ? `Discount ($${formatAmount(currentQuotationInfo.breakdown.discountValue)}):`
                        : `Discount (${formatAmount(currentQuotationInfo.breakdown.discountPercentage)}%):`}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography color="error">
                      -{formatCurrency(currentQuotationInfo.breakdown.discountAmount)}
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
                    {formatCurrency(currentQuotationInfo?.breakdown?.finalTotal || 0)}
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

  const handlePrint = useCallback(async (type: "quotation" | "delivery", quotationId: number) => {
    setPrintMenuAnchor(null);
    try {
      const quotationsRepo = new QuotationsRepository();
      const response = await quotationsRepo.getSingle(quotationId);
      if (!response?.quotationData) throw new Error("Quotation not found");
      if (type === "quotation") {
        await printQuotationPDF(response.quotationData as any);
      } else {
        await printQuotationDeliveryNote(response.quotationData as any);
      }
    } catch (error: any) {
      openSnackbar({
        open: true,
        message: error.message || "Failed to print",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }
  }, []);

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
          ${formatAmount(row.total)}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <Chip
            label={row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
            color={
              row.status === "approved"
                ? "success"
                : row.status === "sent"
                  ? "info"
                  : row.status === "draft"
                    ? "warning"
                    : row.status === "converted"
                      ? "primary"
                      : "error"
            }
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedQuotationForStatus(row.id);
              setStatusMenuAnchor(e.currentTarget);
            }}
            sx={{
              fontWeight: 600,
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
            }}
          />
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

            {/* Resend Email (for sent and approved quotations) */}
            {(row.status === "sent" || row.status === "approved") && (
              <Tooltip title="Resend Email">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    resendQuotationEmail(row.id);
                  }}
                  color="primary"
                >
                  <RotateCcw size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* Duplicate Quotation */}
            <Tooltip title="Duplicate Quotation">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateQuotation(row.id);
                }}
              >
                <Copy size={18} />
              </IconButton>
            </Tooltip>

            {/* Print */}
            <Tooltip title="Print">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuotationForPrint(row.id);
                  setPrintMenuAnchor(e.currentTarget);
                }}
              >
                <Printer size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {row.note || "-"}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <Typography variant="body2">
            {row.created_at ? getDateFormatted(row.created_at) : "-"}
          </Typography>
        </TableCell>
      </>
    );
  }
  // ========== EMAIL DIALOG FUNCTIONS ==========

  const quotEmailHeader = `<div style="background-color:#9C6A3A;padding:24px 32px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">TIMBER MAX SUPPLY PTY LTD</h1>
    <p style="color:#f0e0cc;margin:4px 0 0 0;font-size:13px;">ABN: 95 688 199 773</p>
  </div>`;

  const quotEmailFooter = `<div style="background-color:#f5f0eb;padding:16px 32px;text-align:center;font-size:12px;color:#888;">
    <p style="margin:0;">Timber Max Supply Pty Ltd | ABN: 95 688 199 773</p>
    <p style="margin:4px 0 0 0;">Phone: 08 8212 4703 | Email: info@timbermax.com.au | timbermax.com.au</p>
  </div>`;

  const wrapQuotEmailTemplate = (content: string) =>
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#ffffff;">${quotEmailHeader}<div style="padding:32px;">${content}</div>${quotEmailFooter}</div>`;

  const getQuotationFriendlyParts = (quotation: any) => {
    const name = quotation.customer?.name || quotation.customers?.name || "Customer";
    const quotNum = quotation.quotation_number || "";
    const total = `$${(Number(quotation.total) || 0).toFixed(2)}`;
    return {
      greeting: `Dear ${name},`,
      main: `Please find your quotation ${quotNum} for ${total} from Timber Max Supply.`,
      closing: `If you have any questions regarding this quotation, please do not hesitate to contact us.\n\nKind regards,\nTimber Max Supply`,
    };
  };

  const buildQuotationBodyFromParts = (
    quotation: any,
    greeting: string,
    main: string,
    closing: string,
  ): string => {
    const quotNum = quotation.quotation_number || "";
    const total = `$${(Number(quotation.total) || 0).toFixed(2)}`;
    const validUntil = quotation.valid_until ? getDateFormatted(quotation.valid_until) : "";

    const textToHtml = (text: string) =>
      text.split(/\n\n/).map((para) =>
        `<p style="font-size:15px;color:#555;line-height:1.6;">${para.replace(/\n/g, "<br/>")}</p>`
      ).join("");

    const infoBox = `<div style="background-color:#fdf6ef;border-left:4px solid #9C6A3A;padding:16px;margin:24px 0;border-radius:4px;">
      <p style="margin:0;font-size:14px;color:#333;">
        <strong>Quotation:</strong> ${quotNum}<br/>
        <strong>Amount:</strong> ${total}${validUntil ? `<br/><strong>Valid Until:</strong> ${validUntil}` : ""}
      </p>
    </div>`;

    const content = `
      <p style="font-size:16px;color:#333;">${greeting}</p>
      <p style="font-size:15px;color:#555;line-height:1.6;">${main}</p>
      ${infoBox}
      ${textToHtml(closing)}
    `;

    return wrapQuotEmailTemplate(content);
  };

  const generateQuotationEmailBody = (
    quotation: any,
  ): { subject: string; body: string } => {
    const quotNum = quotation.quotation_number || "";
    const parts = getQuotationFriendlyParts(quotation);
    return {
      subject: `Quotation ${quotNum} from Timber Max Supply`,
      body: buildQuotationBodyFromParts(quotation, parts.greeting, parts.main, parts.closing),
    };
  };

  const openQuotationEmailDialog = async (row: any, resend = false) => {
    const quotNum = row.quotation_number || "";
    const baseSubject = `Quotation ${quotNum} from Timber Max Supply`;
    const subject = resend ? `[Resend] ${baseSubject}` : baseSubject;
    const { body } = generateQuotationEmailBody(row);
    const parts = getQuotationFriendlyParts(row);
    setEmailIsResend(resend);
    setEmailQuotationData(row);
    setEmailTo(row.customer?.email || row.customers?.email || "");
    setEmailSubject(subject);
    setEmailBody(body);
    setEmailFriendlyGreeting(parts.greeting);
    setEmailFriendlyMain(parts.main);
    setEmailFriendlyClosing(parts.closing);
    setEmailEditMode("preview");
    setEmailExtraRecipients([]);
    setEmailPdfBase64("");
    setEmailPdfFileName("");
    setEmailDialogOpen(true);

    // Generate the compressed PDF in-memory only — attached directly at send time, never stored
    try {
      const quotationsRepo = new QuotationsRepository();
      const quotationResponse = await quotationsRepo.getSingle(row.id);
      if (quotationResponse?.quotationData) {
        // For resend keep current status; for initial send override to "sent"
        const quotationDataForPdf = resend
          ? quotationResponse.quotationData
          : { ...quotationResponse.quotationData, status: "sent" };
        const pdfResult = await generateQuotationPDFBase64(quotationDataForPdf);
        if (pdfResult.success && pdfResult.base64) {
          const fileName = pdfResult.fileName || `quotation_${row.quotation_number}.pdf`;
          setEmailPdfBase64(pdfResult.base64);
          setEmailPdfFileName(fileName);
        }
      }
    } catch (e) {
      console.error("Failed to generate quotation PDF for email:", e);
    }
  };

  const closeQuotationEmailDialog = () => {
    setEmailDialogOpen(false);
    setEmailQuotationData(null);
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
    setEmailIsResend(false);
  };

  const proceedAfterQuotationEmail = async () => {
    if (!emailQuotationData) return;
    // For resend, no status change needed
    if (emailIsResend) return;
    try {
      const quotationsRepo = new QuotationsRepository();
      const result = await quotationsRepo.updateStatus(emailQuotationData.id, "sent");
      if (result.success) {
        openSnackbar({
          open: true,
          message: "Quotation marked as sent",
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
        await getData();
      } else {
        throw new Error(result.error || "Failed to update status");
      }
    } catch (error: any) {
      openSnackbar({
        open: true,
        message: `Failed to mark as sent: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }
  };

  const sendQuotationEmail = async () => {
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
      const rawRecipients = [emailTo, ...emailExtraRecipients.map((e) => e.trim()), MANDATORY_QUOTATION_CC].filter(Boolean);
      const allRecipients = Array.from(new Set(rawRecipients.map((e) => e.toLowerCase())));

      // Raw base64 (strip the "data:application/pdf;...;base64," prefix) for the EmailJS attachment
      const pdfContent = emailPdfBase64.includes(",")
        ? emailPdfBase64.split(",")[1]
        : emailPdfBase64;

      await Promise.all(
        allRecipients.map((recipient) =>
          emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            {
              to_email: recipient,
              subject: emailSubject,
              body: emailBody,
              // Variable attachment — declared in the EmailJS template settings
              content: pdfContent,
              file_name: emailPdfFileName || "quotation.pdf",
            },
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
      await proceedAfterQuotationEmail();
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
      closeQuotationEmailDialog();
    }
  };

  const skipQuotationEmail = async () => {
    await proceedAfterQuotationEmail();
    closeQuotationEmailDialog();
  };

  // Memoized Email Dialog for quotations
  const EmailDialog = useMemo(
    () => (
      <Dialog
        open={emailDialogOpen}
        onClose={closeQuotationEmailDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        {/* Header bar */}
        <Box sx={{ backgroundColor: emailIsResend ? "#1976d2" : "#9C6A3A", px: 3, py: 2 }}>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
            {emailIsResend ? "Resend Quotation Email" : "Send Quotation Email"}
          </Typography>
          {emailQuotationData && (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5 }}>
              {emailQuotationData.quotation_number} — {emailQuotationData.customer?.name || emailQuotationData.customers?.name || "Customer"}
            </Typography>
          )}
        </Box>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* To & Subject */}
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

            {/* Mandatory CC (always applied) */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                label="CC (always)"
                value={MANDATORY_QUOTATION_CC}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                helperText="Automatically CC'd on every quotation email"
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

            {/* PDF attachment indicator */}
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
                  {emailPdfFileName || "Quotation PDF"}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                  {emailPdfBase64
                    ? "Ready — attached directly to this email"
                    : "Generating PDF…"}
                </Typography>
              </Box>
              {emailPdfBase64 ? (
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
                    Generating…
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Mode selector tabs */}
            <Box sx={{ display: "flex", gap: 0.5, borderBottom: "1px solid #e0e0e0" }}>
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
                      color: isActive ? "#9C6A3A" : "text.secondary",
                      borderBottom: isActive ? "2px solid #9C6A3A" : "2px solid transparent",
                      borderRadius: 0,
                      px: 1.5,
                      pb: 0.75,
                      minHeight: 0,
                      "&:hover": { backgroundColor: "transparent", color: "#9C6A3A" },
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
                  Edit the message content below. Quotation details (amounts, dates) in the highlighted box are auto-populated from the quotation.
                </Typography>
                <TextField
                  label="Greeting"
                  value={emailFriendlyGreeting}
                  onChange={(e) => {
                    setEmailFriendlyGreeting(e.target.value);
                    if (emailQuotationData) {
                      setEmailBody(buildQuotationBodyFromParts(
                        emailQuotationData,
                        e.target.value, emailFriendlyMain, emailFriendlyClosing,
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
                    if (emailQuotationData) {
                      setEmailBody(buildQuotationBodyFromParts(
                        emailQuotationData,
                        emailFriendlyGreeting, e.target.value, emailFriendlyClosing,
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
                    if (emailQuotationData) {
                      setEmailBody(buildQuotationBodyFromParts(
                        emailQuotationData,
                        emailFriendlyGreeting, emailFriendlyMain, e.target.value,
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
                  InputProps={{ sx: { fontFamily: "monospace", fontSize: "12px" } }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          {!emailIsResend && (
            <Button
              onClick={skipQuotationEmail}
              variant="outlined"
              color="inherit"
              disabled={emailSending}
              sx={{ textTransform: "none", mr: "auto" }}
            >
              Skip Email
            </Button>
          )}
          <Button
            onClick={closeQuotationEmailDialog}
            color="inherit"
            disabled={emailSending}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={sendQuotationEmail}
            variant="contained"
            disabled={emailSending || !emailTo || !emailPdfBase64}
            startIcon={emailSending ? <CircularProgress size={16} /> : <SendIcon size={16} />}
            sx={{
              textTransform: "none",
              backgroundColor: emailIsResend ? "#1976d2" : "#9C6A3A",
              "&:hover": { backgroundColor: emailIsResend ? "#1976d2" : "#9C6A3A", opacity: 0.9 },
            }}
          >
            {emailSending ? "Sending…" : "Send Email"}
          </Button>
        </DialogActions>
      </Dialog>
    ),
    [
      emailDialogOpen,
      emailQuotationData,
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
      emailIsResend,
    ]
  );

  // Add new functions to useQuotations hook
  async function markAsSent(quotationId: number) {
    const row = data.find((q: any) => q.id === quotationId);
    if (!row) return;
    openQuotationEmailDialog(row);
  }

  async function resendQuotationEmail(quotationId: number) {
    const row = data.find((q: any) => q.id === quotationId);
    if (!row) return;
    openQuotationEmailDialog(row, true);
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

  async function duplicateQuotation(quotationId: number) {
    try {
      const quotationsRepo = new QuotationsRepository();

      const quotationResponse = await quotationsRepo.getSingle(quotationId);
      if (!quotationResponse?.quotationData) {
        throw new Error("Quotation not found");
      }

      const existing = quotationResponse.quotationData;
      const nextNumber = await quotationsRepo.getNextQuotationNumber();

      const newQuotation: QuotationSupabase = {
        quotation_number: nextNumber,
        customer_id: existing.customer_id,
        total: existing.total,
        discount: existing.discount || 0,
        discount_type: existing.discount_type || "percentage",
        status: "draft",
        valid_until: existing.valid_until ? new Date(existing.valid_until) : null,
        note: existing.note || "",
        address: existing.address || "",
        suburb: existing.suburb || "",
        state: existing.state || "",
        post_code: existing.post_code || "",
      };

      const items = (existing.quotation_items || []).map((item: any) => ({
        item_id: item.item_id,
        quantity: roundAmount(item.quantity),
        warehouse_id: item.warehouse_id || 1,
      }));

      const result = await quotationsRepo.createWithStockReservation(newQuotation, items);

      if (!result.success) {
        throw new Error(result.error || "Failed to duplicate quotation");
      }

      const newQuotationId = result.quotation?.id;
      if (newQuotationId) {
        const sourceItems = existing.quotation_items || [];
        for (let i = 0; i < sourceItems.length; i++) {
          const item = sourceItems[i];
          await quotationsRepo.addItem({
            quotation_id: newQuotationId,
            item_id: item.item_id,
            quantity: roundAmount(item.quantity),
            unit_price: roundAmount(item.unit_price),
            warehouse_id: item.warehouse_id || 1,
            sort_order: i,
            item_name: item.item_name ?? item.items?.name,
            item_code: item.item_code ?? item.items?.itemCode,
            item_sell_price: item.item_sell_price ?? parseFloat(item.unit_price),
            item_gst: item.item_gst ?? item.items?.gst,
          });
        }
      }

      openSnackbar({
        open: true,
        message: `Quotation duplicated as ${nextNumber}`,
        variant: "alert",
        alert: { color: "success" },
      } as SnackbarProps);
      await getData();
    } catch (error: any) {
      console.error("Error duplicating quotation:", error);
      openSnackbar({
        open: true,
        message: `Failed to duplicate quotation: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
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
          csvString += `"${quotation.quotation_number ?? ""}","${quotation.customer?.name ?? ""}",${formatAmount(quotation.total)},"${quotation.status ?? ""}","${quotation.valid_until ? getDateFormatted(quotation.valid_until) : ""}",${quotation.quotation_items?.length || 0},"${getDateFormatted(quotation.created_at)}","${quotation.note ?? ""}"\n`;
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
      setPage(0);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering quotations:", error);
    }
  }

  function resetFilters() {
    setSearchValue("");
    setFilters(initialFilters);
    setPage(0);
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
        itemsMessage += `${index + 1}. ${(item.item_name ?? item.items?.name) || "Unknown"} (${(item.item_code ?? item.items?.itemCode) || "N/A"})\n`;
        itemsMessage += `   Quantity: ${formatAmount(item.quantity)}\n`;
        itemsMessage += `   Unit Price: $${formatAmount(item.unit_price)}\n`;
        itemsMessage += `   Total: $${formatAmount(item.total_price)}\n\n`;
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

  // Handle quotation status update
  const handleStatusUpdate = async (status: string) => {
    if (!selectedQuotationForStatus) return;

    // "sent" routes through the email dialog
    if (status === "sent") {
      const row = data.find((q: any) => q.id === selectedQuotationForStatus);
      setStatusMenuAnchor(null);
      setSelectedQuotationForStatus(null);
      if (row) openQuotationEmailDialog(row);
      return;
    }

    try {
      const quotationsRepo = new QuotationsRepository();
      const result = await quotationsRepo.updateStatus(
        selectedQuotationForStatus,
        status as any
      );

      if (result.success) {
        openSnackbar({
          open: true,
          message: `Quotation status updated to ${status}`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
        await getData();
      } else {
        throw new Error(result.error || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Error updating quotation status:", error);
      openSnackbar({
        open: true,
        message: `Failed to update status: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      setStatusMenuAnchor(null);
      setSelectedQuotationForStatus(null);
    }
  };

  const updateQuotationStatus = async (quotationId: number, status: string) => {
    return handleStatusUpdate(status);
  };

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
    statusMenuAnchor,
    selectedQuotationForStatus,
    printMenuAnchor,
    selectedQuotationForPrint,

    // State setters
    setOrder,
    setOrderBy,
    setSelected,
    setPage,
    setRowsPerPage,
    setSearchValue,
    setStatusMenuAnchor,
    setPrintMenuAnchor,
    handlePrint,

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
    duplicateQuotation,
    resendQuotationEmail,
    updateQuotationStatus,
    downloadQuotationPDF,
    previewQuotationPDF,
    ItemsModal,
    EmailDialog,
    // Constants
    headCells,
  };
}
