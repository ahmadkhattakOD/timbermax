import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useUsers } from "./useUsers";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import {
  getDateTimeFormatted,
  hasNonEmptyValue,
  userRoles,
} from "utils/helpers";
import ModalFilters from "components/modal-filters/ModalFilters";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { CSVLink } from "react-csv";
import SearchInput from "components/SearchInput";

export default function Users() {
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
  } = useUsers();

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <ActionButton text={"add-new-user"} onClick={goToCreate} />
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
              placeholder="Search User"
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
        tableTitle="users"
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
        title="filter-users"
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
                      id={"fullName"}
                      name={"fullName"}
                      placeholder={"Full Name"}
                      label={"full-name"}
                      type={"text"}
                    />,
                    <FormInput
                      id={"email"}
                      name={"email"}
                      placeholder={"Username"}
                      label={"username"}
                      type={"text"}
                    />,
                    <FormDropdown
                      id={"role"}
                      name={"role"}
                      label={"role"}
                      useFormattedStrings={false}
                      options={userRoles}
                    />,
                    <FormInput
                      id={"minimumDailyWage"}
                      name={"minimumDailyWage"}
                      placeholder={"Minimum Daily Wage"}
                      label={"minimum-daily-wage"}
                      type={"number"}
                      min={0}
                    />,
                    <FormInput
                      id={"maximumDailyWage"}
                      name={"maximumDailyWage"}
                      placeholder={"Maximum Daily Wage"}
                      label={"maximum-daily-wage"}
                      type={"number"}
                      min={0}
                    />,
                    // <FormInput
                    //   id={"minimumCommission"}
                    //   name={"minimumCommission"}
                    //   placeholder={"Minimum Commission"}
                    //   label={"minimum-commission"}
                    //   type={"number"}
                    //   min={0}
                    // />,
                    // <FormInput
                    //   id={"maximumCommission"}
                    //   name={"maximumCommission"}
                    //   placeholder={"Maximum Commission"}
                    //   label={"maximum-commission"}
                    //   type={"number"}
                    //   min={0}
                    // />,
                    <FormInput
                      id={"joinedAtFrom"}
                      name={"joinedAtFrom"}
                      placeholder={"Joined At From"}
                      label={"joined-at-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"joinedAtTo"}
                      name={"joinedAtTo"}
                      placeholder={"Joined At To"}
                      label={"joined-at-to"}
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
        filename={`users_${getDateTimeFormatted()}.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </Box>
  );
}
