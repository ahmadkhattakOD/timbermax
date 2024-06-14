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
    fullName,
    profilePicture,
    cancelledSales,
    totalCommission,
  } = useViewInvoices();

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
            <ProfilePicture />
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
                Bonuses:{" "}
                <span style={{ fontWeight: 700 }}>
                  {invoiceRules.travel_bonus}
                </span>{" "}
                +{" "}
                <span style={{ fontWeight: 700 }}>
                  {invoiceRules.other_bonuses}
                </span>
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
                  {invoiceRules.travel_bonus +
                    invoiceRules.other_bonuses +
                    totalCommission -
                    cancelledSales -
                    invoiceRules.deductions >=
                  0
                    ? invoiceRules.travel_bonus +
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
        openFilterModal={openDeleteConfirmModal}
      />
      <ModalDeleteConfirm
        open={deleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onDelete={onDelete}
      />
    </Box>
  );
}
