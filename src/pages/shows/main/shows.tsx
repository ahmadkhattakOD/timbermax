import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useShows } from "./useShows";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import {
  australianStates,
  getDateTimeFormatted,
  hasNonEmptyValue,
} from "utils/helpers";
import ModalFilters from "components/modal-filters/ModalFilters";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { CSVLink } from "react-csv";

export default function Shows() {
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
  } = useShows();

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <ActionButton text={"add-new-show"} onClick={goToCreate} />
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
        tableTitle="shows"
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
        title="filter-shows"
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
                      id={"name"}
                      name={"name"}
                      placeholder={"Name"}
                      label={"name"}
                      type={"text"}
                    />,
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
                      id={"address"}
                      name={"address"}
                      placeholder={"Address"}
                      label={"address"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"suburb"}
                      name={"suburb"}
                      placeholder={"Suburb"}
                      label={"suburb"}
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
        filename={`shows_${getDateTimeFormatted()}.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </Box>
  );
}
