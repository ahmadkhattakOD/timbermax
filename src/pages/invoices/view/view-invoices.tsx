import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useViewInvoices } from "./useViewInvoices";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import { getDateTimeFormatted, getInitials, hasNonEmptyValue, userRoles } from "utils/helpers";
import ModalFilters from "components/modal-filters/ModalFilters";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import ProfilePicture from "components/ProfilePicture";
import { Typography } from "@mui/material";
import { CSVLink } from "react-csv";

export default function ViewInvoices() {
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
    fullName,
    markSelectedAsPaid,
    markSelectedAsPending,
    getDataCsv,
    csvData,
    csvLink,
  } = useViewInvoices();

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{ display: "flex", justifyContent: "start", paddingBottom: "2rem" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <ProfilePicture
            avatarChild={
              <Typography sx={{ fontWeight: 800 }}>
                {getInitials(fullName)}
              </Typography>
            }
          />
          <Typography variant="h4">{fullName}</Typography>
        </Box>
      </Box>
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
            {selected.length > 0 && (
              <ActionButton
                text={"mark-selected-as-paid"}
                color="primary"
                onClick={markSelectedAsPaid}
              />
            )}
            {selected.length > 0 && (
              <ActionButton
                text={"mark-selected-as-pending"}
                color="secondary"
                onClick={markSelectedAsPending}
              />
            )}
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
        takeToOnClick="download"
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
                      id={"startDateFrom"}
                      name={"startDateFrom"}
                      placeholder={"Start Date From"}
                      label={"start-date-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"startDateTo"}
                      name={"startDateTo"}
                      placeholder={"Start Date To"}
                      label={"start-date-to"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"endDateFrom"}
                      name={"endDateFrom"}
                      placeholder={"End Date From"}
                      label={"end-date-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"endDateTo"}
                      name={"endDateTo"}
                      placeholder={"End Date To"}
                      label={"end-date-to"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"minimumWages"}
                      name={"minimumWages"}
                      placeholder={"Minimum Wages"}
                      label={"minimum-wages"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"maximumWages"}
                      name={"maximumWages"}
                      placeholder={"Maximum Wages"}
                      label={"maximum-wages"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"minimumTravelBonus"}
                      name={"minimumTravelBonus"}
                      placeholder={"Minimum Travel Bonus"}
                      label={"minimum-travel-bonus"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"maximumTravelBonus"}
                      name={"maximumTravelBonus"}
                      placeholder={"Maximum Travel Bonus"}
                      label={"maximum-travel-bonus"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"minimumOtherBonuses"}
                      name={"minimumOtherBonuses"}
                      placeholder={"Minimum Other Bonuses"}
                      label={"minimum-other-bonuses"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"maximumOtherBonuses"}
                      name={"maximumOtherBonuses"}
                      placeholder={"Maximum Other Bonuses"}
                      label={"maximum-other-bonuses"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"minimumTotalCommission"}
                      name={"minimumTotalCommission"}
                      placeholder={"Minimum Total Commission"}
                      label={"minimum-total-commission"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"maximumTotalCommission"}
                      name={"maximumTotalCommission"}
                      placeholder={"Maximum Total Commission"}
                      label={"maximum-total-commission"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"minimumCancelledSales"}
                      name={"minimumCancelledSales"}
                      placeholder={"Minimum Cancelled Sales"}
                      label={"minimum-cancelled-sales"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"maximumCancelledSales"}
                      name={"maximumCancelledSales"}
                      placeholder={"Maximum Cancelled Sales"}
                      label={"maximum-cancelled-sales"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"minimumDeductions"}
                      name={"minimumDeductions"}
                      placeholder={"Minimum Deductions"}
                      label={"minimum-deductions"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"maximumDeductions"}
                      name={"maximumDeductions"}
                      placeholder={"Maximum Deductions"}
                      label={"maximum-deductions"}
                      type={"number"}
                      min={0}
                    />,
                    <FormDropdown
                      id={"status"}
                      name={"status"}
                      label={"status"}
                      options={["pending", "paid"]}
                    />,
                    <FormInput
                      id={"generatedAtFrom"}
                      name={"generatedAtFrom"}
                      placeholder={"Generated At From"}
                      label={"generated-at-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"generatedAtTo"}
                      name={"generatedAtTo"}
                      placeholder={"Generated At To"}
                      label={"generated-at-to"}
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
