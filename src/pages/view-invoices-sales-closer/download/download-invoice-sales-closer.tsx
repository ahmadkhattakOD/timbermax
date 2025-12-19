import Box from "@mui/material/Box";
import { useDownloadInvoiceSalesCloser } from "./useDownloadInvoiceSalesCloser";
import { getDateFormatted, getInitials, hasNonEmptyValue } from "utils/helpers";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormInput from "components/FormInput";
import ProfilePicture from "components/ProfilePicture";
import { Typography, useTheme } from "@mui/material";
import CircularLoader from "components/CircularLoader";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFDownload from "./pdf-download";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import DataTable from "components/data-table/DataTable";
import ModalFilters from "components/modal-filters/ModalFilters";

export default function DownloadInvoiceSalesCloser() {
  const {
    invoice,
    fullName,
    role,
    validate,
    loading,
    grandTotal,
    dataSales,
    dataCountSales,
    loadingSales,
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
    filterModalOpenSales,
    openFilterModalSales,
    closeFilterModalSales,
    handleFiltersSubmitSales,
    validateFiltersSales,
    filtersSales,
    resetFiltersSales,
    dataCancelled,
    dataCountCancelled,
    loadingCancelled,
    orderCancelled,
    setOrderCancelled,
    orderByCancelled,
    setOrderByCancelled,
    selectedCancelled,
    setSelectedCancelled,
    pageCancelled,
    setPageCancelled,
    rowsPerPageCancelled,
    setRowsPerPageCancelled,
    headCellsCancelled,
    generateTableCellsCancelled,
  } = useDownloadInvoiceSalesCloser();

  const theme = useTheme();

  if (loading) {
    return (
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
    );
  }
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Typography variant="h4">{fullName}</Typography>
            <PDFDownloadLink
              document={
                <PDFDownload
                  createdAt={getDateFormatted(invoice.created_at)}
                  fullName={fullName}
                  wages={invoice.wages ? invoice.wages.toFixed(2) : "-"}
                  travelBonus={
                    invoice.travel_bonus ? invoice.travel_bonus.toFixed(2) : "-"
                  }
                  otherBonuses={
                    invoice.other_bonuses
                      ? invoice.other_bonuses.toFixed(2)
                      : "-"
                  }
                  deductions={
                    invoice.deductions ? invoice.deductions.toFixed(2) : "-"
                  }
                  cancelledSales={
                    invoice.cancelled_sales
                      ? invoice.cancelled_sales.toFixed(2)
                      : "-"
                  }
                  totalCommission={
                    invoice.total_commission
                      ? invoice.total_commission.toFixed(2)
                      : "-"
                  }
                  total={grandTotal.toFixed(2)}
                  role={role}
                  startDate={getDateFormatted(invoice.start_date)}
                  endDate={getDateFormatted(invoice.end_date)}
                  status={invoice.status ?? ""}
                  salesData={dataSales}
                  cancelledData={dataCancelled}
                />
              }
              fileName={`invoice_${getInitials(fullName)}_${getDateFormatted()}.pdf`}
              style={{
                textDecoration: "underline",
                textUnderlineOffset: 5,
                color: theme.palette.primary.dark,
                fontWeight: 600,
              }}
            >
              {/* {({ loading }) => (loading ? "Loading..." : "Download PDF")} */}
              Download PDF
            </PDFDownloadLink>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box
          sx={{
            paddingTop: "2rem",
            paddingBottom: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Typography>
            {getDateFormatted(invoice.start_date)}&nbsp;&nbsp;&nbsp;{"-"}
            &nbsp;&nbsp;&nbsp;
            {getDateFormatted(invoice.end_date)}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 400 }}>
            Total:{" "}
            <span style={{ fontWeight: 700 }}>{grandTotal.toFixed(2)}</span>
          </Typography>
        </Box>
      </Box>
      <Formik
        enableReinitialize
        initialValues={{
          wages: invoice?.wages ?? "",
          travelBonus: invoice?.travel_bonus ?? "",
          otherBonuses: invoice?.other_bonuses ?? "",
          deductions: invoice?.deductions ?? "",
          cancelledSales: invoice?.cancelled_sales ?? "",
          totalCommission: invoice?.total_commission ?? "",
        }}
        validate={validate}
        onSubmit={() => {}}
      >
        {({ handleSubmit, errors, touched, isSubmitting }) => (
          <Form onSubmit={handleSubmit}>
            <FormLayout
              isSubmitting={isSubmitting}
              showSubmitButton={false}
              inputs={[
                <FormInput
                  id={"totalCommission"}
                  name={"totalCommission"}
                  placeholder={"Total Commission"}
                  label={"total-commission"}
                  type={"number"}
                  disabled
                  // error={touched.totalCommission ? errors.totalCommission : ""}
                />,
                <FormInput
                  id={"cancelledSales"}
                  name={"cancelledSales"}
                  placeholder={"Cancelled Sales"}
                  label={"cancelled-sales"}
                  type={"number"}
                  disabled
                  // error={touched.cancelledSales ? errors.cancelledSales : ""}
                />,
                <FormInput
                  id={"wages"}
                  name={"wages"}
                  placeholder={"Wages"}
                  label={"wages"}
                  type={"number"}
                  disabled
                  // error={touched.wages ? errors.wages : ""}
                />,
                <FormInput
                  id={"travelBonus"}
                  name={"travelBonus"}
                  placeholder={"Travel Bonus"}
                  label={"travel-bonus"}
                  type={"number"}
                  disabled
                  // error={touched.travelBonus ? errors.travelBonus : ""}
                />,
                <FormInput
                  id={"otherBonuses"}
                  name={"otherBonuses"}
                  placeholder={"Other Bonuses"}
                  label={"other-bonuses"}
                  type={"number"}
                  disabled
                  // error={touched.otherBonuses ? errors.otherBonuses : ""}
                />,
                <FormInput
                  id={"deductions"}
                  name={"deductions"}
                  placeholder={"Deductions"}
                  label={"deductions"}
                  type={"number"}
                  disabled
                  // error={touched.deductions ? errors.deductions : ""}
                />,
              ]}
            />
          </Form>
        )}
      </Formik>
      <CreateAndFiltersLayout
        filters={
          hasNonEmptyValue(filtersSales) ? (
            <ActionButton
              text={"reset-filters"}
              color="secondary"
              onClick={resetFiltersSales}
            />
          ) : (
            <></>
          )
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
        showFilter={false}
        clickable={false}
        selectable={false}
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
            {({ handleSubmit, errors, touched, isSubmitting, values }) => (
              <Form onSubmit={handleSubmit}>
                <FormLayout
                  isSubmitting={isSubmitting}
                  submitButtonText={"apply"}
                  inputs={[
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
      <CreateAndFiltersLayout />
      <DataTable
        data={dataCancelled}
        dataCount={dataCountCancelled}
        loading={loadingCancelled}
        tableTitle="cancelled-sales-table"
        selected={selectedCancelled}
        setSelected={setSelectedCancelled}
        rowsPerPage={rowsPerPageCancelled}
        setRowsPerPage={setRowsPerPageCancelled}
        page={pageCancelled}
        setPage={setPageCancelled}
        orderBy={orderByCancelled}
        setOrderBy={setOrderByCancelled}
        order={orderCancelled}
        setOrder={setOrderCancelled}
        headCells={headCellsCancelled}
        generateTableCells={generateTableCellsCancelled}
        showFilter={false}
        clickable={false}
        selectable={false}
      />
    </Box>
  );
}
