// project-imports
import { Box, Typography } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useViewDelivery } from "./useViewDelivery";
import CircularLoader from "components/CircularLoader";
import {
  australianStates,
  getDateFormattedForField,
  getDateTimeFormattedForField,
} from "utils/helpers";
import DataTable from "components/data-table/DataTable";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";

// ==============================|| EDIT SALE PAGE ||============================== //

export default function ViewDelivery() {
  const {
    validate,
    onSubmit,
    sale,
    loading,
    salesPersons,
    closers,
    shows,
    warehouses,
    opportunities,
    data,
    dataCount,
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
  } = useViewDelivery();

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
    <>
      <CreateAndFiltersLayout />
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
        selectable={false}
        clickable={false}
        showFilter={false}
      />
      <Box display={"flex"} paddingBottom={"2rem"} paddingTop={"2rem"}>
        <Typography>
          This delivery has been closed and is no longer editable.
        </Typography>
      </Box>
      <Formik
        enableReinitialize
        initialValues={{
          contactName: sale?.contact_name ?? "",
          opportunityDescription: sale?.opportunity_description ?? "",
          deposit: sale?.deposit ?? "",
          total: sale?.total ?? "",
          paymentMethod: sale?.payment_method ?? "",
          phone: sale?.phone ?? "",
          address: sale?.address ?? "",
          state: sale?.state ?? "",
          postCode: sale?.post_code ?? "",
          emailAddress: sale?.email_address ?? "",
          note: sale?.note ?? "",
          salesPerson: sale?.sales_person.id ?? "",
          closer: sale?.closer.id ?? "",
          status: sale?.status ?? "",
          show: sale?.show?.id ?? "",
          followUpNotes: sale?.follow_up_notes ?? "",
          saleDate: getDateFormattedForField(sale?.sale_date) ?? "",
          deliveryDateTime:
            getDateTimeFormattedForField(sale?.delivery_date_time) ?? "",
          invoiceDate: getDateFormattedForField(sale?.invoice_date) ?? "",
          stockFromWarehouse: sale?.stock_from_warehouse.id ?? "",
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ handleSubmit, errors, touched, isSubmitting, values }) => (
          <Form onSubmit={handleSubmit}>
            <FormLayout
              isSubmitting={isSubmitting}
              showSubmitButton={false}
              inputs={[
                <FormInput
                  id={"contactName"}
                  name={"contactName"}
                  placeholder={"Contact Name"}
                  label={"contact-name"}
                  optional={false}
                  type={"text"}
                  disabled
                  error={touched.contactName ? errors.contactName : ""}
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
                  optional={false}
                  disabled
                  error={touched.salesPerson ? errors.salesPerson : ""}
                />,
                <FormInput
                  id={"deposit"}
                  name={"deposit"}
                  placeholder={"Deposit"}
                  label={"deposit"}
                  secondaryLabel={
                    values.deposit && values.total
                      ? `${((parseFloat(values.deposit) / parseFloat(values.total)) * 100).toFixed(2)}%`
                      : null
                  }
                  optional={false}
                  type={"number"}
                  min={0}
                  disabled
                  error={touched.deposit ? errors.deposit : ""}
                />,
                <FormInput
                  id={"total"}
                  name={"total"}
                  placeholder={"Total"}
                  label={"total"}
                  secondaryLabel={
                    values.deposit && values.total
                      ? `Balance: $${parseFloat(values.total) - parseFloat(values.deposit)}`
                      : null
                  }
                  optional={false}
                  type={"number"}
                  min={0}
                  disabled
                  error={touched.total ? errors.total : ""}
                />,
                <FormDropdown
                  id={"paymentMethod"}
                  name={"paymentMethod"}
                  label={"payment-method"}
                  optional={false}
                  options={[
                    "cash",
                    "card",
                    "bank-transfer",
                    "finance",
                    "ndis",
                    "care-package",
                  ]}
                  disabled
                  error={touched.paymentMethod ? errors.paymentMethod : ""}
                />,
                <FormInput
                  id={"phone"}
                  name={"phone"}
                  placeholder={"Phone"}
                  label={"phone"}
                  type={"text"}
                  disabled
                />,
                <FormInput
                  id={"address"}
                  name={"address"}
                  placeholder={"Address"}
                  label={"address"}
                  type={"text"}
                  disabled
                />,
                <FormDropdown
                  id={"state"}
                  name={"state"}
                  label={"state"}
                  useFormattedStrings={false}
                  options={australianStates}
                  disabled
                />,
                <FormInput
                  id={"postCode"}
                  name={"postCode"}
                  placeholder={"Post Code"}
                  label={"post-code"}
                  type={"text"}
                  disabled
                />,
                <FormInput
                  id={"emailAddress"}
                  name={"emailAddress"}
                  placeholder={"Email Address"}
                  label={"email-address"}
                  type={"email"}
                  disabled
                />,
                <FormInput
                  id={"note"}
                  name={"note"}
                  placeholder={"Note"}
                  label={"note"}
                  type={"text"}
                  isTextArea
                  disabled
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
                  disabled
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
                  optional={false}
                  disabled
                  error={touched.closer ? errors.closer : ""}
                />,
                <FormDropdown
                  id={"status"}
                  name={"status"}
                  label={"status"}
                  optional={false}
                  options={[
                    "delivered",
                    "cancelled",
                    "deposited-twenty-plus",
                    "scheduled-for-delivery",
                    "on-hold",
                    "ready-for-delivery",
                  ]}
                  disabled
                  disabledValues={["delivered"]}
                  error={touched.status ? errors.status : ""}
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
                  optional={false}
                  disabled
                  error={touched.show ? errors.show : ""}
                />,
                <FormInput
                  id={"saleDate"}
                  name={"saleDate"}
                  placeholder={"Sale Date"}
                  label={"sale-date"}
                  optional={false}
                  type={"date"}
                  max={getDateFormattedForField()}
                  disabled
                  error={touched.saleDate ? errors.saleDate : ""}
                />,
                <FormInput
                  id={"followUpNotes"}
                  name={"followUpNotes"}
                  placeholder={"Follow Up Notes"}
                  label={"follow-up-notes"}
                  type={"text"}
                  isTextArea
                  disabled
                />,
                <FormInput
                  id={"deliveryDateTime"}
                  name={"deliveryDateTime"}
                  placeholder={"Delivery Date & Time"}
                  label={"delivery-date-time"}
                  optional={false}
                  type={"datetime-local"}
                  disabled
                  error={
                    touched.deliveryDateTime ? errors.deliveryDateTime : ""
                  }
                />,
                <FormDropdown
                  id={"stockFromWarehouse"}
                  name={"stockFromWarehouse"}
                  label={"stock-from-warehouse"}
                  useFormattedStrings={false}
                  options={warehouses.map((warehouse) => {
                    return {
                      label: warehouse.name,
                      value: warehouse.id.toString(),
                    };
                  })}
                  optional={false}
                  disabled
                  error={
                    touched.stockFromWarehouse ? errors.stockFromWarehouse : ""
                  }
                />,
                <FormInput
                  id={"invoiceDate"}
                  name={"invoiceDate"}
                  placeholder={"Invoice Date"}
                  label={"invoice-date"}
                  optional={false}
                  type={"date"}
                  disabled
                  error={touched.invoiceDate ? errors.invoiceDate : ""}
                />,
              ]}
            />
          </Form>
        )}
      </Formik>
    </>
  );
}
