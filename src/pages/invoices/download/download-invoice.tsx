import Box from "@mui/material/Box";
import { useDownloadInvoice } from "./useDownloadInvoice";
import { formatAmount, getDateFormatted, getInitials } from "utils/helpers";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormInput from "components/FormInput";
import ProfilePicture from "components/ProfilePicture";
import { Typography, useTheme } from "@mui/material";
import CircularLoader from "components/CircularLoader";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFDownload from "./pdf-download";
import DataTable from "components/data-table/DataTable";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";

export default function DownloadInvoice() {
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
  } = useDownloadInvoice();

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
                  wages={invoice.wages ? formatAmount(invoice.wages) : "-"}
                  travelBonus={
                    invoice.travel_bonus ? formatAmount(invoice.travel_bonus) : "-"
                  }
                  otherBonuses={
                    invoice.other_bonuses
                      ? formatAmount(invoice.other_bonuses)
                      : "-"
                  }
                  deductions={
                    invoice.deductions ? formatAmount(invoice.deductions) : "-"
                  }
                  cancelledSales={
                    invoice.cancelled_sales
                      ? formatAmount(invoice.cancelled_sales)
                      : "-"
                  }
                  totalCommission={
                    invoice.total_commission
                      ? formatAmount(invoice.total_commission)
                      : "-"
                  }
                  total={formatAmount(grandTotal)}
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
            <span style={{ fontWeight: 700 }}>{formatAmount(grandTotal)}</span>
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
      <CreateAndFiltersLayout />
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
