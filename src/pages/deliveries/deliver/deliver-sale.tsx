// project-imports
import { Box, Typography, useTheme } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useDeliverSale } from "./useDeliverSale";
import CircularLoader from "components/CircularLoader";
import {
  australianStates,
  getDateFormattedForField,
  getDateTimeFormattedForField,
  formatAmount,
} from "utils/helpers";
import { Trash } from "iconsax-react";
import { IconButton } from "@mui/material";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import { FormattedMessage } from "react-intl";

// ==============================|| EDIT SALE PAGE ||============================== //

export default function DeliverSale() {
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
    selectedOpportunities,
  } = useDeliverSale();

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
    <>
      <Box display={"flex"} paddingBottom={"2rem"}>
        <Typography>
          {sale?.closed
            ? "This sale has been closed and is ready to be marked as delivered."
            : "This sale has not been closed yet. Press the button below to close it and mark it as delivered."}
        </Typography>
      </Box>
      {sale && sale.milestone && (
        <CreateAndFiltersLayout
          filters={
            <Box
              sx={{
                width: "30%",
                padding: "0.5rem",
                paddingLeft: "1rem",
                paddingRight: "1rem",
                borderRadius: "0.5rem",
                color: theme.palette.primary.contrastText,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textTransform: "uppercase",
                backgroundColor:
                  sale.milestone === "won"
                    ? theme.palette.success.main
                    : sale.milestone === "in-progress"
                      ? theme.palette.warning.main
                      : sale.milestone === "lost"
                        ? theme.palette.error.main
                        : theme.palette.secondary.main,
              }}
            >
              <FormattedMessage id={sale.milestone} />
            </Box>
          }
        />
      )}
      <Formik
        enableReinitialize
        initialValues={{
          contactName: sale.customer?.name ?? "",
          deposit: sale.deposit != null ? formatAmount(sale.deposit) : "",
          total: sale.total != null ? formatAmount(sale.total) : "",
          paymentMethod: sale.payment_method ?? "",
          phone: sale.phone ?? "",
          mobile: sale.mobile ?? "",
          address: sale.address ?? "",
          state: sale.state ?? "",
          postCode: sale.post_code ?? "",
          emailAddress: sale.email_address ?? "",
          note: sale.note ?? "",
          salesPerson: sale.sales_person.id ?? "",
          closer: sale.closer.id ?? "",
          status: sale.status ?? "",
          milestone: sale.milestone ?? "",
          expectedCloseDate: sale.expected_close_date
            ? getDateFormattedForField(sale.expected_close_date)
            : "",
          lostReason: sale.lost_reason ?? "",
          show: sale.show?.id ?? "",
          followUpNotes: sale.follow_up_notes ?? "",
          saleDate: getDateFormattedForField(sale.sale_date) ?? "",
          deliveryDateTime: getDateTimeFormattedForField() ?? "",
          stockFromWarehouse: "",
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ handleSubmit, errors, touched, isSubmitting, values }) => (
          <Form onSubmit={handleSubmit}>
            <FormLayout
              isSubmitting={isSubmitting}
              submitButtonText={
                sale?.closed
                  ? "mark-as-delivered"
                  : "close-and-mark-as-delivered"
              }
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
                      ? `Balance: $${formatAmount(parseFloat(values.total) - parseFloat(values.deposit))}`
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
                  id={"mobile"}
                  name={"mobile"}
                  placeholder={"Mobile"}
                  label={"mobile"}
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
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {selectedOpportunities.map((opportunity, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        gap: "0.5rem",
                        flexDirection: "row",
                        alignItems: "flex-end",
                      }}
                    >
                      <FormDropdown
                        id={"opportunityDescription"}
                        name={"opportunityDescription"}
                        label={
                          idx === 0 ? "opportunity-description" : undefined
                        }
                        useFormattedStrings={false}
                        value={opportunity}
                        onChange={(e) => {}}
                        options={opportunities.map((opportunity) => {
                          return {
                            label: opportunity.name,
                            value: opportunity.name,
                          };
                        })}
                        disabled
                      />
                    </Box>
                  ))}
                </Box>,
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
                  id={"milestone"}
                  name={"milestone"}
                  label={"milestone"}
                  disabled
                  options={["won", "in-progress", "lost"]}
                />,
                values.milestone === "lost" ? (
                  <FormInput
                    id={"lostReason"}
                    name={"lostReason"}
                    placeholder={"Lost Reason"}
                    label={"lost-reason"}
                    type={"text"}
                    disabled
                    isTextArea
                  />
                ) : null,
                <FormInput
                  id={"expectedCloseDate"}
                  name={"expectedCloseDate"}
                  placeholder={"Expected Close Date"}
                  label={"expected-close-date"}
                  type={"date"}
                  disabled
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
                />,
                <FormInput
                  id={"deliveryDateTime"}
                  name={"deliveryDateTime"}
                  placeholder={"Delivery Date & Time"}
                  label={"delivery-date-time"}
                  optional={false}
                  type={"datetime-local"}
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
                  error={
                    touched.stockFromWarehouse ? errors.stockFromWarehouse : ""
                  }
                />,
              ]}
            />
          </Form>
        )}
      </Formik>
    </>
  );
}
