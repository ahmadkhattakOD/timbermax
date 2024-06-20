import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import { useViewInvoices } from "./useViewInvoices";
import FormLayout from "components/FormLayout";
import FormInput from "components/FormInput";
import { Form, Formik } from "formik";
import CircularLoader from "components/CircularLoader";
import { Divider, Typography } from "@mui/material";
import ProfilePicture from "components/ProfilePicture";
import { useTheme } from "@mui/system";
import { getInitials, hasNonEmptyValue } from "utils/helpers";
import ModalFilters from "components/modal-filters/ModalFilters";
import FormDropdown from "components/FormDropdown";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFInvoice from "./pdf-invoice";

export default function ViewInvoices() {
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
    validate,
    onSubmit,
    invoiceRulesLoading,
    invoiceRules,
    totalWages,
    fullName,
    profilePicture,
    cancelledSales,
    totalCommission,
    filterModalOpen,
    openFilterModal,
    closeFilterModal,
    handleFiltersSubmit,
    validateFilters,
    filters,
    sales,
    resetFilters,
  } = useViewInvoices();

  const theme = useTheme();

  return (
    <Box sx={{ width: "100%" }}>
      <PDFDownloadLink document={<PDFInvoice />} fileName="invoice.pdf">
        {({ blob, url, loading, error }) =>
          loading ? "Loading document..." : "Download PDF TEST"
        }
      </PDFDownloadLink>

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
        filters={
          !invoiceRulesLoading ? (
            <Box
              sx={{
                paddingBottom: "2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "center", sm: "flex-end" },
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 400 }}>
                Wages: <span style={{ fontWeight: 700 }}>{totalWages}</span>
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 400 }}>
                Travel Bonus:{" "}
                <span style={{ fontWeight: 700 }}>
                  {invoiceRules.travel_bonus}
                </span>
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 400 }}>
                Other Bonuses:{" "}
                <span style={{ fontWeight: 700 }}>
                  {invoiceRules.other_bonuses}
                </span>{" "}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 400 }}>
                Total Commission:{" "}
                <span style={{ fontWeight: 700 }}>{totalCommission}</span>
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 400 }}>
                Cancelled Sales:{" "}
                <span style={{ fontWeight: 700 }}>({cancelledSales})</span>
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 400 }}>
                Deductions:{" "}
                <span style={{ fontWeight: 700 }}>
                  ({invoiceRules.deductions})
                </span>
              </Typography>
              <Box
                sx={{
                  height: "1px",
                  width: "100%",
                  backgroundColor: theme.palette.secondary.light,
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              ></Box>
              <Typography variant="h5" sx={{ fontWeight: 400 }}>
                Total:{" "}
                <span style={{ fontWeight: 700 }}>
                  {totalWages +
                    invoiceRules.travel_bonus +
                    invoiceRules.other_bonuses +
                    totalCommission -
                    cancelledSales -
                    invoiceRules.deductions >=
                  0
                    ? totalWages +
                      invoiceRules.travel_bonus +
                      invoiceRules.other_bonuses +
                      totalCommission -
                      cancelledSales -
                      invoiceRules.deductions
                    : `(${invoiceRules.travel_bonus + invoiceRules.other_bonuses + totalCommission - cancelledSales - invoiceRules.deductions})`}
                </span>
              </Typography>
            </Box>
          ) : (
            <></>
          )
        }
      />
      <Box sx={{ paddingBottom: "2rem" }}>
        {invoiceRulesLoading ? (
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
              showDays: invoiceRules.show_days.toString(),
              travelBonus: invoiceRules.travel_bonus.toString(),
              otherBonuses: invoiceRules.other_bonuses.toString(),
              deductions: invoiceRules.deductions.toString(),
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
                      id={"showDays"}
                      name={"showDays"}
                      placeholder={"Show Days"}
                      label={"show-days"}
                      type={"number"}
                      error={touched.showDays ? errors.showDays : ""}
                    />,
                    <FormInput
                      id={"travelBonus"}
                      name={"travelBonus"}
                      placeholder={"Travel Bonus"}
                      label={"travel-bonus"}
                      type={"number"}
                      error={touched.showDays ? errors.showDays : ""}
                    />,
                    <FormInput
                      id={"otherBonuses"}
                      name={"otherBonuses"}
                      placeholder={"Other Bonuses"}
                      label={"other-bonuses"}
                      type={"number"}
                      error={touched.otherBonuses ? errors.otherBonuses : ""}
                    />,
                    <FormInput
                      id={"deductions"}
                      name={"deductions"}
                      placeholder={"Deductions"}
                      label={"deductions"}
                      type={"number"}
                      error={touched.deductions ? errors.deductions : ""}
                    />,
                  ]}
                />
              </Form>
            )}
          </Formik>
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
        clickable={false}
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
    </Box>
  );
}
