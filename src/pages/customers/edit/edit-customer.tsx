// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditCustomer } from "./useEditCustomer";
import CircularLoader from "components/CircularLoader";
import {
  australianStates,
  getDateFormatted,
  getDateFormattedForField,
  getDateTimeFormatted,
  hasNonEmptyValue,
} from "utils/helpers";
import PlacesInput from "components/PlacesInput";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import SearchInput from "components/SearchInput";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import ModalFilters from "components/modal-filters/ModalFilters";
import { CSVLink } from "react-csv";

// ==============================|| EDIT CUSTOMER PAGE ||============================== //

export default function EditCustomer() {
  const {
    validate,
    onSubmit,
    customer,
    loadingInfo,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
    selectedTab,
    setSelectedTab,
    dataSales,
    dataCountSales,
    loadingSales,
    goToCreateSales,
    orderSales,
    setOrderSales,
    orderBySales,
    setOrderBySales,
    selectedSales,
    setSelectedSales,
    pageSales,
    setPageSales,
    rowsPerPageSales,
    setRowsPerPageSales,
    headCellsSales,
    generateTableCellsSales,
    onDeleteSales,
    deleteConfirmModalOpenSales,
    openDeleteConfirmModalSales,
    closeDeleteConfirmModalSales,
    filterModalOpenSales,
    openFilterModalSales,
    closeFilterModalSales,
    handleFiltersSubmitSales,
    validateFiltersSales,
    filtersSales,
    salesPersons,
    closers,
    shows,
    opportunities,
    resetFiltersSales,
    getDataCsvSales,
    csvDataSales,
    csvLinkSales,
  } = useEditCustomer();

  return (
    <>
      <CreateAndFiltersLayout
        actionButton={
          <Box sx={{ display: "flex", gap: "1rem" }}>
            <ActionButton
              text={"information"}
              color={selectedTab === "Information" ? "primary" : "secondary"}
              onClick={() => {
                setSelectedTab("Information");
              }}
            />
            <ActionButton
              text={"sales"}
              color={selectedTab === "Sales" ? "primary" : "secondary"}
              onClick={() => {
                setSelectedTab("Sales");
              }}
            />
            <ActionButton
              text={"history"}
              color={selectedTab === "History" ? "primary" : "secondary"}
              onClick={() => {
                setSelectedTab("History");
              }}
            />
          </Box>
        }
      />
      {selectedTab === "Information" && (
        <>
          {loadingInfo ? (
            <Box
              sx={{
                height: "100%",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularLoader />
            </Box>
          ) : (
            <Formik
              enableReinitialize
              initialValues={{
                name: customer.name ?? "",
                milestone: customer.milestone ?? "",
                expectedCloseDate: customer.expected_close_date
                  ? getDateFormattedForField(customer.expected_close_date)
                  : "",
                email: customer.email ?? "",
                phone: customer.phone ?? "",
                mobile: customer.mobile ?? "",
                address: customer.address ?? "",
                suburb: customer.suburb ?? "",
                state: customer.state ?? "",
                postCode: customer.post_code ?? "",
                lostReason: customer.lost_reason ?? "",
                notes: customer.notes ?? "",
              }}
              validate={validate}
              onSubmit={onSubmit}
            >
              {({ handleSubmit, errors, touched, isSubmitting, values }) => (
                <Form onSubmit={handleSubmit}>
                  <FormLayout
                    isSubmitting={isSubmitting}
                    submitButtonText={"submit"}
                    inputs={[
                      <FormInput
                        id={"name"}
                        name={"name"}
                        placeholder={"Name"}
                        label={"name"}
                        optional={false}
                        type={"text"}
                        error={touched.name ? errors.name : ""}
                      />,
                      <FormDropdown
                        id={"milestone"}
                        name={"milestone"}
                        label={"milestone"}
                        options={["won", "in-progress", "lost"]}
                      />,
                      <FormInput
                        id={"expectedCloseDate"}
                        name={"expectedCloseDate"}
                        placeholder={"Expected Close Date"}
                        label={"expected-close-date"}
                        type={"date"}
                        error={
                          touched.expectedCloseDate
                            ? errors.expectedCloseDate
                            : ""
                        }
                      />,
                      <FormInput
                        id={"email"}
                        name={"email"}
                        placeholder={"Email"}
                        label={"email"}
                        type={"text"}
                        error={touched.email ? errors.email : ""}
                      />,
                      <FormInput
                        id={"phone"}
                        name={"phone"}
                        placeholder={"Phone"}
                        label={"phone"}
                        type={"text"}
                        error={touched.phone ? errors.phone : ""}
                      />,
                      <FormInput
                        id={"mobile"}
                        name={"mobile"}
                        placeholder={"Mobile"}
                        label={"mobile"}
                        type={"text"}
                        error={touched.mobile ? errors.mobile : ""}
                      />,
                      <PlacesInput
                        id="address"
                        name="address"
                        placeholder="Address"
                        onChange={changeAddress}
                        value={selectedAddress}
                        label="address"
                      />,
                      <FormInput
                        id={"suburb"}
                        name={"suburb"}
                        placeholder={"Suburb"}
                        label={"suburb"}
                        type={"text"}
                        value={selectedSuburb}
                        onChange={(e) => {
                          setSelectedSuburb(e.target.value);
                        }}
                      />,
                      <FormDropdown
                        id={"state"}
                        name={"state"}
                        label={"state"}
                        useFormattedStrings={false}
                        options={australianStates}
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                        }}
                      />,
                      <FormInput
                        id={"postCode"}
                        name={"postCode"}
                        placeholder={"Post Code"}
                        label={"post-code"}
                        type={"text"}
                      />,
                      <FormInput
                        id={"notes"}
                        name={"notes"}
                        placeholder={"Notes"}
                        label={"notes"}
                        type={"text"}
                        isTextArea
                      />,
                      values.milestone === "lost" && (
                        <FormInput
                          id={"lostReason"}
                          name={"lostReason"}
                          placeholder={"Lost Reason"}
                          label={"lost-reason"}
                          type={"text"}
                          isTextArea
                        />
                      ),
                    ]}
                  />
                </Form>
              )}
            </Formik>
          )}
        </>
      )}
      {selectedTab === "Sales" && (
        <>
          {loadingSales ? (
            <Box
              sx={{
                height: "100%",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularLoader />
            </Box>
          ) : (
            <Box sx={{ width: "100%" }}>
              <CreateAndFiltersLayout
                actionButton={
                  <ActionButton
                    text={"add-new-sale"}
                    onClick={goToCreateSales}
                  />
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
                    
                    {hasNonEmptyValue(filtersSales) ? (
                      <ActionButton
                        text={"reset-filters"}
                        color="secondary"
                        onClick={resetFiltersSales}
                      />
                    ) : (
                      <></>
                    )}
                  </Box>
                }
              />
              <DataTable
                data={dataSales}
                dataCount={dataCountSales}
                loading={loadingSales}
                tableTitle="sales"
                selected={selectedSales}
                setSelected={setSelectedSales}
                rowsPerPage={rowsPerPageSales}
                setRowsPerPage={setRowsPerPageSales}
                page={pageSales}
                setPage={setPageSales}
                orderBy={orderBySales}
                setOrderBy={setOrderBySales}
                order={orderSales}
                setOrder={setOrderSales}
                headCells={headCellsSales}
                generateTableCells={generateTableCellsSales}
                openDeleteConfirmModal={openDeleteConfirmModalSales}
                openFilterModal={openFilterModalSales}
                onDownload={getDataCsvSales}
              />
              <ModalDeleteConfirm
                open={deleteConfirmModalOpenSales}
                onClose={closeDeleteConfirmModalSales}
                onDelete={onDeleteSales}
              />
              <ModalFilters
                title="filter-sales"
                open={filterModalOpenSales}
                onClose={closeFilterModalSales}
                form={
                  <Formik
                    enableReinitialize
                    initialValues={filtersSales}
                    validate={validateFiltersSales}
                    onSubmit={handleFiltersSubmitSales}
                  >
                    {({
                      handleSubmit,
                      errors,
                      touched,
                      isSubmitting,
                      values,
                    }) => (
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
                            onClick={closeFilterModalSales}
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
                data={csvDataSales}
                headers={headCellsSales.map((cell) => cell.label)}
                filename={`sales_${getDateTimeFormatted()}.csv`}
                className="hidden"
                ref={csvLinkSales}
                target="_blank"
              />
            </Box>
          )}
        </>
      )}
      {selectedTab === "History" && <></>}
    </>
  );
}
