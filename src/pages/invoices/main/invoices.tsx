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
import {
  getDateTimeFormatted,
  hasNonEmptyValue,
} from "utils/helpers";
import { CSVLink } from "react-csv";
import SearchInput from "components/SearchInput";

export default function Invoices() {
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
  } = useInvoices();
  
  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <ActionButton text={"add-new-invoice"} onClick={goToCreate} />
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
            />
            {hasNonEmptyValue(filters) ? (
              <ActionButton
                text={"reset-filters"}
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
      <ModalDeleteConfirm
        open={deleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onDelete={onDelete}
      />
      <ModalFilters
        title="filter-invoices"
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
                  submitButtonText={"apply"}
                  inputs={[
                    <FormInput
                      id={"invoice_number"}
                      name={"invoice_number"}
                      placeholder={"Invoice Number"}
                      label={"invoice-number"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"customer_name"}
                      name={"customer_name"}
                      placeholder={"Customer Name"}
                      label={"customer-name"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"quotation_number"}
                      name={"quotation_number"}
                      placeholder={"Quotation Number"}
                      label={"quotation-number"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"minimumTotal"}
                      name={"minimumTotal"}
                      placeholder={"Minimum Total"}
                      label={"minimum-total"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"maximumTotal"}
                      name={"maximumTotal"}
                      placeholder={"Maximum Total"}
                      label={"maximum-total"}
                      type={"number"}
                      min={0}
                    />,
                    <FormDropdown
                      id={"status"}
                      name={"status"}
                      label={"status"}
                      options={[
                        "draft",
                        "sent",
                        "paid",
                        "cancelled"
                      ]}
                    />,
                    <FormInput
                      id={"invoice_date_from"}
                      name={"invoice_date_from"}
                      placeholder={"Invoice Date From"}
                      label={"invoice-date-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"invoice_date_to"}
                      name={"invoice_date_to"}
                      placeholder={"Invoice Date To"}
                      label={"invoice-date-to"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"created_at_from"}
                      name={"created_at_from"}
                      placeholder={"Created From"}
                      label={"created-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"created_at_to"}
                      name={"created_at_to"}
                      placeholder={"Created To"}
                      label={"created-to"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"item_name"}
                      name={"item_name"}
                      placeholder={"Item Name"}
                      label={"item-name"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"item_code"}
                      name={"item_code"}
                      placeholder={"Item Code"}
                      label={"item-code"}
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
                    text={"cancel"}
                  />
                  <ActionButton type="submit" text={"apply"} />
                </Box>
              </Form>
            )}
          </Formik>
        }
      />
      <CSVLink
        data={csvData}
        headers={headCells.map((cell) => cell.label)}
        filename={`invoices_${getDateTimeFormatted()}.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </Box>
  );
}