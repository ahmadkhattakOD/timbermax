import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useDeliveries } from "./useDeliveries";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import ModalFilters from "components/modal-filters/ModalFilters";
import FormInput from "components/FormInput";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormDropdown from "components/FormDropdown";
import { Typography } from "@mui/material";
import {
  australianStates,
  getDateFormattedForField,
  getDateTimeFormatted,
  hasNonEmptyValue,
} from "utils/helpers";
import { CSVLink } from "react-csv";

export default function Deliveries() {
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
    salesPersons,
    closers,
    shows,
    opportunities,
    resetFilters,
    getDataCsv,
    csvData,
    csvLink,
  } = useDeliveries();

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <ActionButton text={"add-new-delivery"} onClick={goToCreate} />
        }
        filters={
          hasNonEmptyValue(filters) ? (
            <ActionButton
              text={"reset-filters"}
              color="secondary"
              onClick={resetFilters}
            />
          ) : (
            <></>
          )
        }
      />
      <DataTable
        data={data}
        dataCount={dataCount}
        loading={loading}
        tableTitle="deliveries"
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
        takeToOnClick="view"
        onDownload={getDataCsv}
      />
      <ModalDeleteConfirm
        open={deleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onDelete={onDelete}
      />
      <ModalFilters
        title="filter-deliveries"
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
                      id={"contactName"}
                      name={"contactName"}
                      placeholder={"Contact Name"}
                      label={"contact-name"}
                      type={"text"}
                    />,
                    <FormDropdown
                      id={"salesPerson"}
                      name={"salesPerson"}
                      label={"sales-person"}
                      useFormattedStrings={false}
                      options={salesPersons.map((salesPerson) => {
                        return {
                          label: salesPerson.full_name,
                          value: salesPerson.id.toString(),
                        };
                      })}
                    />,
                    <FormInput
                      id={"minimumDeposit"}
                      name={"minimumDeposit"}
                      placeholder={"Minimum Deposit"}
                      label={"minimum-deposit"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"maximumDeposit"}
                      name={"maximumDeposit"}
                      placeholder={"Maximum Deposit"}
                      label={"maximum-deposit"}
                      type={"number"}
                      min={0}
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
                      id={"paymentMethod"}
                      name={"paymentMethod"}
                      label={"payment-method"}
                      options={[
                        "cash",
                        "card",
                        "bank-transfer",
                        "finance",
                        "ndis",
                        "care-package",
                      ]}
                    />,
                    <FormInput
                      id={"phone"}
                      name={"phone"}
                      placeholder={"Phone"}
                      label={"phone"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"address"}
                      name={"address"}
                      placeholder={"Address"}
                      label={"address"}
                      type={"text"}
                    />,
                    <FormDropdown
                      id={"state"}
                      name={"state"}
                      label={"state"}
                      useFormattedStrings={false}
                      options={australianStates}
                    />,
                    <FormInput
                      id={"postCode"}
                      name={"postCode"}
                      placeholder={"Post Code"}
                      label={"post-code"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"emailAddress"}
                      name={"emailAddress"}
                      placeholder={"Email Address"}
                      label={"email-address"}
                      type={"email"}
                    />,
                    <FormDropdown
                      id={"opportunityDescription"}
                      name={"opportunityDescription"}
                      label={"opportunity-description"}
                      useFormattedStrings={false}
                      options={opportunities.map((opportunity) => {
                        return {
                          label: opportunity.name,
                          value: opportunity.name,
                        };
                      })}
                    />,
                    <FormDropdown
                      id={"closer"}
                      name={"closer"}
                      label={"closer"}
                      useFormattedStrings={false}
                      options={closers.map((closer) => {
                        return {
                          label: closer.full_name,
                          value: closer.id.toString(),
                        };
                      })}
                    />,
                    <FormDropdown
                      id={"show"}
                      name={"show"}
                      label={"show"}
                      useFormattedStrings={false}
                      options={shows.map((show) => {
                        return {
                          label: show.name,
                          value: show.id.toString(),
                        };
                      })}
                    />,
                    <FormInput
                      id={"saleDateFrom"}
                      name={"saleDateFrom"}
                      placeholder={"Sale Date From"}
                      label={"sale-date-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"saleDateTo"}
                      name={"saleDateTo"}
                      placeholder={"Sale Date To"}
                      label={"sale-date-to"}
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
        filename={`deliveries_${getDateTimeFormatted()}.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </Box>
  );
}
