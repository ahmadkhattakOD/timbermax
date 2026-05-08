// pages/invoices/MainInvoices.tsx
import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useInvoices } from "./useInvoices";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import ModalFilters from "components/modal-filters/ModalFilters";
import FormInput from "components/FormInput";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormDropdown from "components/FormDropdown";
import { getDateTimeFormatted, hasNonEmptyValue } from "utils/helpers";
import { CSVLink } from "react-csv";
import SearchInput from "components/SearchInput";
import {
  Button,
  Typography,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Download,
  Truck,
  Send,
  Wallet,
  Eye,
  Printer,
  FileText,
  MoreVertical,
  Package,
  CheckCircle,
  ArrowLeft,
  LucideTruck,
} from "lucide-react";

// Define filter type
interface ValuesFilterInvoices {
  invoice_number: string;
  customer_name: string;
  quotation_number: string;
  minimumTotal: string;
  maximumTotal: string;
  status: string;
  delivery_status: string;
  invoice_date_from: string;
  invoice_date_to: string;
  created_at_from: string;
  created_at_to: string;
  item_name: string;
  item_code: string;
}

// Initial filters
const initialFilters: ValuesFilterInvoices = {
  invoice_number: "",
  customer_name: "",
  quotation_number: "",
  minimumTotal: "",
  maximumTotal: "",
  status: "",
  delivery_status: "",
  invoice_date_from: "",
  invoice_date_to: "",
  created_at_from: "",
  created_at_to: "",
  item_name: "",
  item_code: "",
};

export default function MainInvoices() {
  const {
    data,
    dataCount,
    loading,
    goToCreate,
    order,
    setOrder,
    orderBy,
    setOrderBy,
    selected,
    setSelected,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    headCells,
    generateTableCells,
    onDelete,
    deleteConfirmModalOpen,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    filterModalOpen,
    openFilterModal,
    closeFilterModal,
    handleFiltersSubmit,
    validateFilters,
    filters,
    resetFilters,
    getDataCsv,
    csvData,
    csvLink,
    handleSearchDebounced,
    searchValue,
    setSearchValue,

    updateDeliveryStatus,
    updateInvoiceStatus,

    ItemsModal,
    PaymentMethodDialog,
    EmailDialog,
    deliveryMenuAnchor,
    selectedInvoiceForDelivery,
    setDeliveryMenuAnchor,
    statusMenuAnchor,
    selectedInvoiceForStatus,
    setStatusMenuAnchor,
  } = useInvoices();

  // Delivery status menu
  const handleDeliveryMenuClose = () => {
    setDeliveryMenuAnchor(null);
  };

  // Invoice status menu
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <ActionButton
              text="Create New Invoice"
              onClick={goToCreate}
              startIcon={<FileText size={18} />}
            />
          </Box>
        }
        filters={
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              width: "100%",
              alignItems: "flex-end",
            }}
          >
            <SearchInput
              placeholder="Search Invoice Number or Customer"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                handleSearchDebounced(e);
              }}
              // sx={{ width: "300px" }}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              {hasNonEmptyValue(filters) ? (
                <ActionButton
                  text="Reset Filters"
                  color="secondary"
                  onClick={resetFilters}
                  variant="outlined"
                  size="small"
                />
              ) : null}
              <ActionButton
                text="Filter"
                onClick={openFilterModal}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        }
      />

      <DataTable
        data={data}
        dataCount={dataCount}
        loading={loading}
        tableTitle="invoices"
        selected={selected}
        setSelected={setSelected}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        page={page}
        setPage={setPage}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
        order={order}
        setOrder={setOrder}
        headCells={headCells}
        generateTableCells={generateTableCells}
        openDeleteConfirmModal={openDeleteConfirmModal}
        openFilterModal={openFilterModal}
        onDownload={getDataCsv}
      />

      {/* Delivery Status Menu */}
      <Menu
        anchorEl={deliveryMenuAnchor}
        open={Boolean(deliveryMenuAnchor)}
        onClose={handleDeliveryMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 1,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedInvoiceForDelivery) {
              updateDeliveryStatus(selectedInvoiceForDelivery, "pending");
              handleDeliveryMenuClose();
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Pending"
              size="small"
              sx={{
                bgcolor: "warning.light",
                color: "warning.contrastText",
                minWidth: 80,
              }}
            />
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedInvoiceForDelivery) {
              updateDeliveryStatus(selectedInvoiceForDelivery, "packed");
              handleDeliveryMenuClose();
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Packed"
              size="small"
              sx={{
                bgcolor: "info.light",
                color: "info.contrastText",
                minWidth: 80,
              }}
            />
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedInvoiceForDelivery) {
              updateDeliveryStatus(selectedInvoiceForDelivery, "shipped");
              handleDeliveryMenuClose();
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Shipped"
              size="small"
              sx={{
                bgcolor: "primary.light",
                color: "primary.contrastText",
                minWidth: 80,
              }}
            />
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedInvoiceForDelivery) {
              updateDeliveryStatus(selectedInvoiceForDelivery, "delivered");
              handleDeliveryMenuClose();
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Delivered"
              size="small"
              sx={{
                bgcolor: "success.light",
                color: "success.contrastText",
                minWidth: 80,
              }}
            />
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedInvoiceForDelivery) {
              updateDeliveryStatus(selectedInvoiceForDelivery, "returned");
              handleDeliveryMenuClose();
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Returned"
              size="small"
              sx={{
                bgcolor: "error.light",
                color: "error.contrastText",
                minWidth: 80,
              }}
            />
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedInvoiceForDelivery) {
              updateDeliveryStatus(selectedInvoiceForDelivery, "pick_up");
              handleDeliveryMenuClose();
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Pick Up"
              size="small"
              sx={{
                bgcolor: "secondary.light",
                color: "secondary.contrastText",
                minWidth: 80,
              }}
            />
          </Box>
        </MenuItem>
      </Menu>

      {/* Invoice Status Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 1,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedInvoiceForStatus) {
              updateInvoiceStatus(selectedInvoiceForStatus, "draft");
              handleStatusMenuClose();
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Draft"
              size="small"
              color="warning"
              sx={{ minWidth: 80 }}
            />
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedInvoiceForStatus) {
              updateInvoiceStatus(selectedInvoiceForStatus, "sent");
              handleStatusMenuClose();
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Sent"
              size="small"
              color="info"
              sx={{ minWidth: 80 }}
            />
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedInvoiceForStatus) {
              updateInvoiceStatus(selectedInvoiceForStatus, "paid");
              handleStatusMenuClose();
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Paid"
              size="small"
              color="success"
              sx={{ minWidth: 80 }}
            />
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedInvoiceForStatus) {
              if (
                window.confirm(
                  "Are you sure you want to cancel this invoice? This will restore stock."
                )
              ) {
                updateInvoiceStatus(selectedInvoiceForStatus, "cancelled");
                handleStatusMenuClose();
              }
            }
          }}
          sx={{ py: 1.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
            }}
          >
            <Chip
              label="Cancelled"
              size="small"
              color="error"
              sx={{ minWidth: 80 }}
            />
          </Box>
        </MenuItem>
      </Menu>

      {PaymentMethodDialog}
      {EmailDialog}

      <ModalDeleteConfirm
        open={deleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onDelete={onDelete}
        // message={`Are you sure you want to delete ${selected.length} selected invoice(s)? This action cannot be undone.`}
      />

      <ModalFilters
        title="Filter Invoices"
        open={filterModalOpen}
        onClose={closeFilterModal}
        form={
          <Formik
            enableReinitialize
            initialValues={filters}
            validate={validateFilters}
            onSubmit={handleFiltersSubmit}
          >
            {({ handleSubmit, errors, touched, isSubmitting, values }) => (
              <Form onSubmit={handleSubmit}>
                <FormLayout
                  isSubmitting={isSubmitting}
                  submitButtonText="Apply"
                  inputs={[
                    <FormInput
                      key="invoice_number"
                      id={"invoice_number"}
                      name={"invoice_number"}
                      placeholder={"e.g., INV-2024-001"}
                      label="Invoice Number"
                      type={"text"}
                    />,
                    <FormInput
                      key="customer_name"
                      id={"customer_name"}
                      name={"customer_name"}
                      placeholder={"Customer name"}
                      label="Customer Name"
                      type={"text"}
                    />,
                    <FormInput
                      key="quotation_number"
                      id={"quotation_number"}
                      name={"quotation_number"}
                      placeholder={"e.g., QT-2024-001"}
                      label="Quotation Number"
                      type={"text"}
                    />,
                    <Box sx={{ display: "flex", gap: 2 }} key="total_range">
                      <FormInput
                        id={"minimumTotal"}
                        name={"minimumTotal"}
                        placeholder={"Min"}
                        label="Min Total"
                        type={"number"}
                        min={0}
                      />
                      <FormInput
                        id={"maximumTotal"}
                        name={"maximumTotal"}
                        placeholder={"Max"}
                        label="Max Total"
                        type={"number"}
                        min={0}
                      />
                    </Box>,
                    <FormDropdown
                      key="status"
                      id={"status"}
                      name={"status"}
                      label="Invoice Status"
                      options={[
                        { label: "All Statuses", value: "" },
                        { label: "Draft", value: "draft" },
                        { label: "Sent", value: "sent" },
                        { label: "Paid", value: "paid" },
                        { label: "Overdue", value: "overdue" },
                        { label: "Cancelled", value: "cancelled" },
                      ]}
                    />,
                    <FormDropdown
                      key="delivery_status"
                      id={"delivery_status"}
                      name={"delivery_status"}
                      label="Delivery Status"
                      options={[
                        { label: "All Delivery Status", value: "" },
                        { label: "Pending", value: "pending" },
                        { label: "Packed", value: "packed" },
                        { label: "Shipped", value: "shipped" },
                        { label: "Delivered", value: "delivered" },
                        { label: "Pick Up", value: "pick_up" },
                        { label: "Returned", value: "returned" },
                      ]}
                    />,
                    <Box
                      sx={{ display: "flex", gap: 2 }}
                      key="invoice_date_range"
                    >
                      <FormInput
                        id={"invoice_date_from"}
                        name={"invoice_date_from"}
                        placeholder={"From"}
                        label="Invoice Date From"
                        type={"date"}
                      />
                      <FormInput
                        id={"invoice_date_to"}
                        name={"invoice_date_to"}
                        placeholder={"To"}
                        label="Invoice Date To"
                        type={"date"}
                      />
                    </Box>,
                    <Box
                      sx={{ display: "flex", gap: 2 }}
                      key="created_date_range"
                    >
                      <FormInput
                        id={"created_at_from"}
                        name={"created_at_from"}
                        placeholder={"From"}
                        label="Created Date From"
                        type={"date"}
                      />
                      <FormInput
                        id={"created_at_to"}
                        name={"created_at_to"}
                        placeholder={"To"}
                        label="Created Date To"
                        type={"date"}
                      />
                    </Box>,
                    <FormInput
                      key="item_name"
                      id={"item_name"}
                      name={"item_name"}
                      placeholder={"Item name"}
                      label="Item Name"
                      type={"text"}
                    />,
                    <FormInput
                      key="item_code"
                      id={"item_code"}
                      name={"item_code"}
                      placeholder={"Item code"}
                      label="Item Code"
                      type={"text"}
                    />,
                  ]}
                  showSubmitButton={false}
                />
                <Box
                  display={"flex"}
                  justifyContent={"center"}
                  gap={"15px"}
                  marginTop={"2rem"}
                >
                  <ActionButton
                    onClick={closeFilterModal}
                    color={"secondary"}
                    text="Cancel"
                    variant="outlined"
                  />
                  <ActionButton
                    type="submit"
                    text="Apply Filters"
                    variant="contained"
                  />
                  <ActionButton
                    onClick={() => {
                      resetFilters();
                      closeFilterModal();
                    }}
                    color={"inherit"}
                    text="Clear All"
                    variant="text"
                  />
                </Box>
              </Form>
            )}
          </Formik>
        }
      />

      <ItemsModal />

      <CSVLink
        data={csvData}
        headers={headCells.map((cell) => ({ label: cell.label, key: cell.id }))}
        filename={`invoices_${getDateTimeFormatted()}.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </Box>
  );
}
