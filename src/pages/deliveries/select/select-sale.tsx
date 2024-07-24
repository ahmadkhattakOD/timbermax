import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useSelectSale } from "./useSelectSale";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import ModalFilters from "components/modal-filters/ModalFilters";
import FormInput from "components/FormInput";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormDropdown from "components/FormDropdown";
import { Typography } from "@mui/material";
import { australianStates, hasNonEmptyValue } from "utils/helpers";
import SearchInput from "components/SearchInput";

export default function SelectSale() {
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
    handleSearchDebounced,
    searchValue,
    setSearchValue,
  } = useSelectSale();

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <Typography>
            Select a sale to continue. Only sales with status not set as
            "Delivered" show up here.
          </Typography>
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
              placeholder="Search Contact"
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
        tableTitle="sales"
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
        openFilterModal={openFilterModal}
        selectable={false}
        takeToOnClick="deliver"
      />
      <ModalFilters
        title="filter-sales"
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
                      id={"mobile"}
                      name={"mobile"}
                      placeholder={"Mobile"}
                      label={"mobile"}
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
                      id={"status"}
                      name={"status"}
                      label={"status"}
                      options={[
                        "delivered",
                        "cancelled",
                        "deposited-twenty-plus",
                        "scheduled-for-delivery",
                        "on-hold",
                        "ready-for-delivery",
                      ]}
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
                    <FormDropdown
                      id={"closed"}
                      name={"closed"}
                      label={"closed"}
                      options={["yes", "no"]}
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
    </Box>
  );
}
