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
import { Typography } from "@mui/material";
import { useCustomerQuotations } from "./use-customer-quotation";

export default function CustomerQuotations() {
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
    convertToInvoice,
    ItemsModal,
    fetchCustomerName,
  } = useCustomerQuotations(id ? parseInt(id) : 0);

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
  console.log("SELECTED", selected);
  return (
    <Box sx={{ width: "100%" }}>
      {/* Customer Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quotations for {customerName || "Customer"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Customer ID: {id}
        </Typography>
      </Box>

      <CreateAndFiltersLayout
        actionButton={
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <ActionButton
              text="Go to customers"
              onClick={() => navigate("/customers")}
              color="secondary"
              variant="outlined"
            />
            <ActionButton
              text="Go to quotes"
              onClick={() => navigate("/quotations")}
              color="secondary"
              variant="outlined"
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
              placeholder="Search Quotation Number"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                handleSearchDebounced(e);
              }}
            />
            {hasNonEmptyValue(filters) ? (
              <ActionButton
                text="Reset Filters"
                color="secondary"
                onClick={resetFilters}
              />
            ) : (
              <></>
            )}
          </Box>
        }
      />

      <DataTable
        data={data}
        dataCount={dataCount}
        loading={loading}
        tableTitle={`customer-quotations-${id}`}
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
        // disableRowClick={true} // Disable row click as requested
      />

      <ModalDeleteConfirm
        open={deleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onDelete={onDelete}
      />

      <ModalFilters
        title={`Filter Quotations for ${customerName || "Customer"}`}
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
                      key="quotation_number"
                      id={"quotation_number"}
                      name={"quotation_number"}
                      placeholder={"Quotation Number"}
                      label="Quotation Number"
                      type={"text"}
                    />,
                    <FormInput
                      key="minimumTotal"
                      id={"minimumTotal"}
                      name={"minimumTotal"}
                      placeholder={"Minimum Total"}
                      label="Minimum Total"
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      key="maximumTotal"
                      id={"maximumTotal"}
                      name={"maximumTotal"}
                      placeholder={"Maximum Total"}
                      label="Maximum Total"
                      type={"number"}
                      min={0}
                    />,
                    <FormDropdown
                      key="status"
                      id={"status"}
                      name={"status"}
                      label="Status"
                      options={[
                        { label: "Draft", value: "draft" },
                        { label: "Sent", value: "sent" },
                        { label: "Accepted", value: "accepted" },
                        { label: "Converted", value: "converted" },
                        { label: "Cancelled", value: "cancelled" },
                        { label: "Approved", value: "approved" },
                      ]}
                    />,
                    <FormInput
                      key="valid_until_from"
                      id={"valid_until_from"}
                      name={"valid_until_from"}
                      placeholder={"Valid From"}
                      label="Valid From"
                      type={"date"}
                    />,
                    <FormInput
                      key="valid_until_to"
                      id={"valid_until_to"}
                      name={"valid_until_to"}
                      placeholder={"Valid To"}
                      label="Valid To"
                      type={"date"}
                    />,
                    <FormInput
                      key="created_at_from"
                      id={"created_at_from"}
                      name={"created_at_from"}
                      placeholder={"Created From"}
                      label="Created From"
                      type={"date"}
                    />,
                    <FormInput
                      key="created_at_to"
                      id={"created_at_to"}
                      name={"created_at_to"}
                      placeholder={"Created To"}
                      label="Created To"
                      type={"date"}
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
                  />
                  <ActionButton type="submit" text="Apply" />
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
        filename={`customer_${id}_quotations_${getDateTimeFormatted()}.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </Box>
  );
}
