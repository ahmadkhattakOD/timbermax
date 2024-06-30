import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import { useCreateInvoice } from "./useCreateInvoice";
import FormLayout from "components/FormLayout";
import FormInput from "components/FormInput";
import { Form, Formik } from "formik";
import CircularLoader from "components/CircularLoader";
import { Divider, Grid, Typography } from "@mui/material";
import ProfilePicture from "components/ProfilePicture";
import { useTheme } from "@mui/system";
import {
  getDateFormatted,
  getDateTimeFormatted,
  getInitials,
  hasNonEmptyValue,
} from "utils/helpers";
import ModalFilters from "components/modal-filters/ModalFilters";
import FormDropdown from "components/FormDropdown";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { CSVLink } from "react-csv";

export default function CreateInvoice() {
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
    validate,
    onSubmit,
    fullName,
    wage,
    profilePicture,
    cancelledSales,
    totalCommission,
    grandTotal,
    filterModalOpen,
    openFilterModal,
    closeFilterModal,
    handleFiltersSubmit,
    validateFilters,
    filters,
    sales,
    resetFilters,
    handleSaleDatesSubmit,
    validateSaleDates,
    profileDataLoading,
    invoiceRules,
    setInvoiceRules,
    saleDateFrom,
    saleDateTo,
    alreadyCreatedInvoice,
    getDataCsv,
    csvData,
    csvLink,
  } = useCreateInvoice();

  const theme = useTheme();

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
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
        }
      />
      <Formik
        enableReinitialize
        initialValues={{
          saleDateFrom: "",
          saleDateTo: "",
        }}
        validate={validateSaleDates}
        onSubmit={handleSaleDatesSubmit}
      >
        {({ handleSubmit, errors, touched, isSubmitting, values }) => (
          <Form onSubmit={handleSubmit} onChange={(e) => {}}>
            <FormLayout
              isSubmitting={isSubmitting}
              submitButtonText={"get-data"}
              inputs={[
                <FormInput
                  id={"saleDateFrom"}
                  name={"saleDateFrom"}
                  placeholder={"Sale Date From"}
                  label={"sale-date-from"}
                  type={"date"}
                  error={touched.saleDateFrom ? errors.saleDateFrom : ""}
                />,
                <FormInput
                  id={"saleDateTo"}
                  name={"saleDateTo"}
                  placeholder={"Sale Date To"}
                  label={"sale-date-to"}
                  type={"date"}
                  error={touched.saleDateTo ? errors.saleDateTo : ""}
                />,
              ]}
            />
          </Form>
        )}
      </Formik>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <Box
          sx={{
            height: "1px",
            width: "70%",
            backgroundColor: theme.palette.secondary.light,
            marginTop: "0.5rem",
            marginBottom: "0.5rem",
          }}
        ></Box>
      </Box>
      {saleDateFrom !== "" && saleDateTo !== "" && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            {!loading && !profileDataLoading ? (
              <Box
                sx={{
                  paddingTop: "2rem",
                  paddingBottom: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 400 }}>
                  Total:{" "}
                  <span style={{ fontWeight: 700 }}>
                    {grandTotal.toFixed(2)}
                  </span>
                </Typography>
              </Box>
            ) : (
              <></>
            )}
          </Box>
          <Box sx={{ paddingBottom: "2rem" }}>
            {loading || profileDataLoading ? (
              <Box
                sx={{
                  paddingTop: "2rem",
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
                  showDays: "",
                  travelBonus: "",
                  otherBonuses: "",
                  deductions: "",
                  cancelledSales: cancelledSales.toFixed(2),
                  totalCommission: totalCommission.toFixed(2),
                }}
                validate={validate}
                onSubmit={onSubmit}
              >
                {({
                  handleSubmit,
                  errors,
                  touched,
                  isSubmitting,
                  values,
                  setFieldValue,
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <FormLayout
                      isSubmitting={isSubmitting}
                      submitButtonText={"generate-invoice"}
                      showSubmitButton={alreadyCreatedInvoice === null}
                      inputs={[
                        <FormInput
                          id={"totalCommission"}
                          name={"totalCommission"}
                          placeholder={"Total Commission"}
                          label={"total-commission"}
                          type={"number"}
                          disabled
                          value={values.totalCommission}
                          onChange={(e) => {
                            setFieldValue("totalCommission", e.target.value);
                          }}
                          error={
                            touched.totalCommission
                              ? errors.totalCommission
                              : ""
                          }
                        />,
                        <FormInput
                          id={"cancelledSales"}
                          name={"cancelledSales"}
                          placeholder={"Cancelled Sales"}
                          label={"cancelled-sales"}
                          type={"number"}
                          disabled
                          value={values.cancelledSales}
                          onChange={(e) => {
                            setFieldValue("cancelledSales", e.target.value);
                          }}
                          error={
                            touched.cancelledSales ? errors.cancelledSales : ""
                          }
                        />,
                        <FormInput
                          id={"showDays"}
                          name={"showDays"}
                          placeholder={"Show Days"}
                          label={"show-days"}
                          type={"number"}
                          secondaryLabel={`Daily Wage: ${wage} (A$)`}
                          value={values.showDays}
                          onChange={(e) => {
                            setFieldValue("showDays", e.target.value);
                            setInvoiceRules({
                              ...invoiceRules,
                              show_days: parseFloat(
                                e.target.value !== "" ? e.target.value : "0"
                              ),
                            });
                          }}
                          error={touched.showDays ? errors.showDays : ""}
                        />,
                        <FormInput
                          id={"travelBonus"}
                          name={"travelBonus"}
                          placeholder={"Travel Bonus"}
                          label={"travel-bonus"}
                          type={"number"}
                          value={values.travelBonus}
                          onChange={(e) => {
                            setFieldValue("travelBonus", e.target.value);
                            setInvoiceRules({
                              ...invoiceRules,
                              travel_bonus: parseFloat(
                                e.target.value !== "" ? e.target.value : "0"
                              ),
                            });
                          }}
                          error={touched.showDays ? errors.showDays : ""}
                        />,
                        <FormInput
                          id={"otherBonuses"}
                          name={"otherBonuses"}
                          placeholder={"Other Bonuses"}
                          label={"other-bonuses"}
                          type={"number"}
                          value={values.otherBonuses}
                          onChange={(e) => {
                            setFieldValue("otherBonuses", e.target.value);
                            setInvoiceRules({
                              ...invoiceRules,
                              other_bonuses: parseFloat(
                                e.target.value !== "" ? e.target.value : "0"
                              ),
                            });
                          }}
                          error={
                            touched.otherBonuses ? errors.otherBonuses : ""
                          }
                        />,
                        <FormInput
                          id={"deductions"}
                          name={"deductions"}
                          placeholder={"Deductions"}
                          label={"deductions"}
                          type={"number"}
                          value={values.deductions}
                          onChange={(e) => {
                            setFieldValue("deductions", e.target.value);
                            setInvoiceRules({
                              ...invoiceRules,
                              deductions: parseFloat(
                                e.target.value !== "" ? e.target.value : "0"
                              ),
                            });
                          }}
                          error={touched.deductions ? errors.deductions : ""}
                        />,
                      ]}
                    />
                  </Form>
                )}
              </Formik>
            )}
            {alreadyCreatedInvoice &&
              alreadyCreatedInvoice.start_date &&
              alreadyCreatedInvoice.end_date && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    color: theme.palette.error.main,
                    padding: "2rem",
                    paddingBottom: 0,
                  }}
                >
                  <Typography sx={{ textAlign: "center" }}>
                    An invoice already exists for the dates:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      {getDateFormatted(alreadyCreatedInvoice.start_date)}
                    </span>{" "}
                    -{" "}
                    <span style={{ fontWeight: "bold" }}>
                      {getDateFormatted(alreadyCreatedInvoice.end_date)}
                    </span>
                    . <br />
                    <br /> Please select another date range to generate an
                    invoice.
                  </Typography>
                </Box>
              )}
          </Box>
          <CreateAndFiltersLayout
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
            clickable={false}
            selectable={false}
            onDownload={getDataCsv}
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
                        <FormDropdown
                          id={"sale"}
                          name={"sale"}
                          label={"sale"}
                          useFormattedStrings={false}
                          options={sales.map((sale) => {
                            return {
                              label: sale.contact_name,
                              value: sale.id.toString(),
                            };
                          })}
                        />,
                        <FormInput
                          id={"minimumCommission"}
                          name={"minimumCommission"}
                          placeholder={"Minimum Commission"}
                          label={"minimum-commission"}
                          type={"number"}
                          min={0}
                        />,
                        <FormInput
                          id={"maximumCommission"}
                          name={"maximumCommission"}
                          placeholder={"Maximum Commission"}
                          label={"maximum-commission"}
                          type={"number"}
                          min={0}
                        />,
                        <FormInput
                          id={"invoiceDateFrom"}
                          name={"invoiceDateFrom"}
                          placeholder={"Invoice Date From"}
                          label={"invoice-date-from"}
                          type={"date"}
                        />,
                        <FormInput
                          id={"invoiceDateTo"}
                          name={"invoiceDateTo"}
                          placeholder={"Invoice Date To"}
                          label={"invoice-date-to"}
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
            filename={`commissioned_sales_${getDateTimeFormatted()}.csv`}
            className="hidden"
            ref={csvLink}
            target="_blank"
          />
        </Box>
      )}
    </Box>
  );
}
