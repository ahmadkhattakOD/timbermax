import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useCustomers } from "./useCustomers";
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
import SearchInput from "components/SearchInput";

export default function Customers() {
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
  } = useCustomers();

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <ActionButton text={"add-new-customer"} onClick={goToCreate} />
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
              placeholder="Search Name"
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
        tableTitle="customers"
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
        title="filter-customers"
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
                    <FormDropdown
                      id={"milestone"}
                      name={"milestone"}
                      label={"milestone"}
                      options={["won", "in-progress", "lost"]}
                    />,
                    <FormInput
                      id={"email"}
                      name={"email"}
                      placeholder={"Email"}
                      label={"email"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"phone"}
                      name={"phone"}
                      placeholder={"Phone"}
                      label={"phone"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"mobile"}
                      name={"mobile"}
                      placeholder={"Mobile"}
                      label={"mobile"}
                      type={"text"}
                    />,

                    <FormInput
                      id={"expectedCloseDateFrom"}
                      name={"expectedCloseDateFrom"}
                      placeholder={"Expected Close Date From"}
                      label={"expected-close-date-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"expectedCloseDateTo"}
                      name={"expectedCloseDateTo"}
                      placeholder={"Expected Close Date To"}
                      label={"expected-close-date-to"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"actualCloseDateFrom"}
                      name={"actualCloseDateFrom"}
                      placeholder={"Actual Close Date From"}
                      label={"actual-close-date-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"actualCloseDateTo"}
                      name={"actualCloseDateTo"}
                      placeholder={"Actual Close Date To"}
                      label={"actual-close-date-to"}
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
        headers={headCells.map((cell) => cell.label)}
        filename={`shows_${getDateTimeFormatted()}.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </Box>
  );
}
