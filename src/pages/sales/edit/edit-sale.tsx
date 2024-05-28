// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditSale } from "./useEditSale";
import CircularLoader from "components/CircularLoader";
import { australianStates, getDateFormatted } from "utils/helpers";

// ==============================|| EDIT SALE PAGE ||============================== //

export default function EditSale() {
  const { validate, onSubmit, sale, loading } = useEditSale();

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
    <Formik
      enableReinitialize
      initialValues={{
        contactName: sale.contact_name ?? "",
        opportunityDescription: sale.opportunity_description ?? "",
        deposit: sale.deposit ?? "",
        total: sale.total ?? "",
        paymentMethod: sale.payment_method ?? "",
        phone: sale.phone ?? "",
        address: sale.address ?? "",
        state: sale.state ?? "",
        postCode: sale.post_code ?? "",
        emailAddress: sale.email_address ?? "",
        note: sale.note ?? "",
        salesPerson: sale.sales_person ?? "",
        closer: sale.closer ?? "",
        status: sale.status ?? "",
        show: sale.show ?? "",
        followUpNotes: sale.follow_up_notes ?? "",
        saleDate: getDateFormatted(sale.sale_date) ?? "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"submit"}
            inputs={[
              <FormInput
                id={"contactName"}
                name={"contactName"}
                placeholder={"Contact Name"}
                label={"contact-name"}
                optional={false}
                type={"text"}
                error={touched.contactName ? errors.contactName : ""}
              />,
              <FormDropdown
                id={"salesPerson"}
                name={"salesPerson"}
                label={"sales-person"}
                useFormattedStrings={false}
                options={[0, 1, 2, 3]}
                optional={false}
                error={touched.salesPerson ? errors.salesPerson : ""}
              />,
              <FormInput
                id={"deposit"}
                name={"deposit"}
                placeholder={"Deposit"}
                label={"deposit"}
                optional={false}
                type={"number"}
                min={0}
                error={touched.deposit ? errors.deposit : ""}
              />,
              <FormInput
                id={"total"}
                name={"total"}
                placeholder={"Total"}
                label={"total"}
                optional={false}
                type={"number"}
                min={0}
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
                error={touched.paymentMethod ? errors.paymentMethod : ""}
              />,
              <FormInput
                id={"phone"}
                name={"phone"}
                placeholder={"Phone"}
                label={"phone"}
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
              <FormInput
                id={"note"}
                name={"note"}
                placeholder={"Note"}
                label={"note"}
                type={"text"}
                isTextArea
              />,
              <FormInput
                id={"opportunityDescription"}
                name={"opportunityDescription"}
                placeholder={"Opportunity Description"}
                label={"opportunity-description"}
                type={"text"}
                isTextArea
              />,
              <FormDropdown
                id={"closer"}
                name={"closer"}
                label={"closer"}
                useFormattedStrings={false}
                options={[0, 1, 2, 3]}
                optional={false}
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
                error={touched.status ? errors.status : ""}
              />,
              <FormDropdown
                id={"show"}
                name={"show"}
                label={"show"}
                useFormattedStrings={false}
                options={[0, 1, 2, 3]}
                optional={false}
                error={touched.show ? errors.show : ""}
              />,
              <FormInput
                id={"saleDate"}
                name={"saleDate"}
                placeholder={"Sale Date"}
                label={"sale-date"}
                optional={false}
                type={"date"}
                max={getDateFormatted()}
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
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
