import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
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
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import { Download, Truck, Send, Wallet, FileText, X } from "lucide-react";
import { useCustomerInvoices } from "./use-customer-invoice";

export default function CustomerInvoices() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState<string>("");

  const {
    data,
    dataCount,
    loading,
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
    markAsPaid,
    cancelInvoice,
    updateDeliveryStatus,
    downloadInvoicePDF,
    downloadDeliveryNotePDF,
    ItemsModal,
    deliveryMenuAnchor,
    selectedInvoiceForDelivery,
    setDeliveryMenuAnchor,
    markAsSent,
    fetchCustomerName,
  } = useCustomerInvoices(id ? parseInt(id) : 0);

  // Fetch customer name on mount
  useEffect(() => {
    const loadCustomerName = async () => {
      if (id) {
        const name = await fetchCustomerName(parseInt(id));
        setCustomerName(name);
      }
    };
    loadCustomerName();
  }, [id]);

  // Delivery status menu
  const handleDeliveryMenuClose = () => {
    setDeliveryMenuAnchor(null);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Customer Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Invoices for {customerName || "Customer"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Customer ID: {id}
        </Typography>
      </Box>

      <CreateAndFiltersLayout
        actionButton={
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {selected.length === 1 && (
              <>
                <Tooltip title="Download Invoice PDF">
                  <Button
                    variant="outlined"
                    startIcon={<Download size={18} />}
                    onClick={() => downloadInvoicePDF(selected[0])}
                    sx={{ gap: 1 }}
                  >
                    PDF
                  </Button>
                </Tooltip>
                <Tooltip title="Download Delivery Note">
                  <Button
                    variant="outlined"
                    startIcon={<Truck size={18} />}
                    onClick={() => downloadDeliveryNotePDF(selected[0])}
                    sx={{ gap: 1 }}
                    color="secondary"
                  >
                    Delivery Note
                  </Button>
                </Tooltip>
              </>
            )}
            {selected.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={openDeleteConfirmModal}
                sx={{ gap: 1 }}
              >
                Delete ({selected.length})
              </Button>
            )}
            <ActionButton
              text="Go to All Invoices"
              onClick={() => navigate("/invoices")}
              color="secondary"
              variant="outlined"
            />
            <ActionButton
              text="Go to All customers"
              onClick={() => navigate("/customers")}
              color="secondary"
              variant="outlined"
            />
            <ActionButton
              text="Create New Invoice"
              onClick={() => navigate(`/invoices/create?customer=${id}`)}
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
              placeholder="Search Invoice Number"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                handleSearchDebounced(e);
              }}
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
            </Box>
          </Box>
        }
      />

      {/* Bulk Actions Section */}
      {selected.length > 0 && (
        <Box
          sx={{
            mt: 2,
            mb: 2,
            p: 2,
            backgroundColor: "primary.lighter",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {selected.length} invoice(s) selected
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Send size={16} />}
              onClick={() => {
                selected.forEach((invoiceId) => markAsSent(invoiceId));
              }}
              disabled={loading}
            >
              Mark as Sent
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<Wallet size={16} />}
              onClick={() => {
                selected.forEach((invoiceId) => markAsPaid(invoiceId));
              }}
              disabled={loading}
              color="success"
            >
              Mark as Paid
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<Download size={16} />}
              onClick={() => {
                selected.forEach((invoiceId) => downloadInvoicePDF(invoiceId));
              }}
              disabled={loading}
              color="primary"
            >
              Download PDFs
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelected([])}
              disabled={loading}
            >
              Clear Selection
            </Button>
          </Box>
        </Box>
      )}

      <DataTable
        data={data}
        dataCount={dataCount}
        loading={loading}
        tableTitle={`customer-invoices-${id}`}
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
      </Menu>

      <ModalDeleteConfirm
        open={deleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onDelete={onDelete}
      />

      <ModalFilters
        title={`Filter Invoices for ${customerName || "Customer"}`}
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
        filename={`customer_${id}_invoices_${getDateTimeFormatted()}.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </Box>
  );
}
