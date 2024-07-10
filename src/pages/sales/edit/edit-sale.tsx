// project-imports
import { Box, Typography } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditSale } from "./useEditSale";
import CircularLoader from "components/CircularLoader";
import {
  australianStates,
  getDateFormatted,
  getDateFormattedForField,
} from "utils/helpers";
import { IconButton } from "@mui/material";
import { Add, Trash } from "iconsax-react";
import PlacesInput from "components/PlacesInput";

// ==============================|| EDIT SALE PAGE ||============================== //

export default function EditSale() {
  const {
    validate,
    onSubmit,
    sale,
    loading,
    salesPersons,
    closers,
    shows,
    opportunities,
    selectedOpportunities,
    handleChangeSelectedOpportunities,
    addSelectedOpportunity,
    removeSelectedOpportunity,
    invoiceCreated,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
  } = useEditSale();

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
  // if (!loading && sale?.closed) {
  //   return (
  //     <>
  //       <Box display={"flex"} paddingBottom={"2rem"}>
  //         <Typography>
  //           This sale has been closed and is no longer editable.
  //         </Typography>
  //       </Box>
  //       <Formik
  //         enableReinitialize
  //         initialValues={{
  //           contactName: sale.contact_name ?? "",
  //           opportunityDescription: sale.opportunity_description ?? "",
  //           deposit: sale.deposit ?? "",
  //           total: sale.total ?? "",
  //           paymentMethod: sale.payment_method ?? "",
  //           phone: sale.phone ?? "",
  //           mobile: sale.mobile ?? "",
  //           address: sale.address ?? "",
  //           state: sale.state ?? "",
  //           postCode: sale.post_code ?? "",
  //           emailAddress: sale.email_address ?? "",
  //           note: sale.note ?? "",
  //           salesPerson: sale.sales_person.id ?? "",
  //           closer: sale.closer.id ?? "",
  //           status: sale.status ?? "",
  //           show: sale.show?.id ?? "",
  //           followUpNotes: sale.follow_up_notes ?? "",
  //           saleDate: getDateFormattedForField(sale.sale_date) ?? "",
  //         }}
  //         validate={validate}
  //         onSubmit={onSubmit}
  //       >
  //         {({ handleSubmit, errors, touched, isSubmitting, values }) => (
  //           <Form onSubmit={handleSubmit}>
  //             <FormLayout
  //               isSubmitting={isSubmitting}
  //               showSubmitButton={false}
  //               inputs={[
  //                 <FormInput
  //                   id={"contactName"}
  //                   name={"contactName"}
  //                   placeholder={"Contact Name"}
  //                   label={"contact-name"}
  //                   optional={false}
  //                   type={"text"}
  //                   disabled
  //                   error={touched.contactName ? errors.contactName : ""}
  //                 />,
  //                 <FormDropdown
  //                   id={"salesPerson"}
  //                   name={"salesPerson"}
  //                   label={"sales-person"}
  //                   useFormattedStrings={false}
  //                   options={salesPersons.map((salesPerson) => {
  //                     return {
  //                       label: salesPerson.full_name,
  //                       value: salesPerson.id.toString(),
  //                     };
  //                   })}
  //                   optional={false}
  //                   disabled
  //                   error={touched.salesPerson ? errors.salesPerson : ""}
  //                 />,
  //                 <FormInput
  //                   id={"deposit"}
  //                   name={"deposit"}
  //                   placeholder={"Deposit"}
  //                   label={"deposit"}
  //                   secondaryLabel={
  //                     values.deposit && values.total
  //                       ? `${((parseFloat(values.deposit) / parseFloat(values.total)) * 100).toFixed(2)}%`
  //                       : null
  //                   }
  //                   optional={false}
  //                   type={"number"}
  //                   min={0}
  //                   disabled
  //                   error={touched.deposit ? errors.deposit : ""}
  //                 />,
  //                 <FormInput
  //                   id={"total"}
  //                   name={"total"}
  //                   placeholder={"Total"}
  //                   label={"total"}
  //                   secondaryLabel={
  //                     values.deposit && values.total
  //                       ? `Balance: $${parseFloat(values.total) - parseFloat(values.deposit)}`
  //                       : null
  //                   }
  //                   optional={false}
  //                   type={"number"}
  //                   min={0}
  //                   disabled
  //                   error={touched.total ? errors.total : ""}
  //                 />,
  //                 <FormDropdown
  //                   id={"paymentMethod"}
  //                   name={"paymentMethod"}
  //                   label={"payment-method"}
  //                   optional={false}
  //                   options={[
  //                     "cash",
  //                     "card",
  //                     "bank-transfer",
  //                     "finance",
  //                     "ndis",
  //                     "care-package",
  //                   ]}
  //                   disabled
  //                   error={touched.paymentMethod ? errors.paymentMethod : ""}
  //                 />,
  //                 <FormInput
  //                   id={"phone"}
  //                   name={"phone"}
  //                   placeholder={"Phone"}
  //                   label={"phone"}
  //                   type={"text"}
  //                   disabled
  //                 />,
  //                 <FormInput
  //                   id={"mobile"}
  //                   name={"mobile"}
  //                   placeholder={"Mobile"}
  //                   label={"mobile"}
  //                   type={"text"}
  //                   disabled
  //                 />,
  //                 <FormInput
  //                   id={"address"}
  //                   name={"address"}
  //                   placeholder={"Address"}
  //                   label={"address"}
  //                   type={"text"}
  //                   disabled
  //                 />,
  //                 <FormDropdown
  //                   id={"state"}
  //                   name={"state"}
  //                   label={"state"}
  //                   useFormattedStrings={false}
  //                   options={australianStates}
  //                   disabled
  //                 />,
  //                 <FormInput
  //                   id={"postCode"}
  //                   name={"postCode"}
  //                   placeholder={"Post Code"}
  //                   label={"post-code"}
  //                   type={"text"}
  //                   disabled
  //                 />,
  //                 <FormInput
  //                   id={"emailAddress"}
  //                   name={"emailAddress"}
  //                   placeholder={"Email Address"}
  //                   label={"email-address"}
  //                   type={"email"}
  //                   disabled
  //                 />,
  //                 <FormInput
  //                   id={"note"}
  //                   name={"note"}
  //                   placeholder={"Note"}
  //                   label={"note"}
  //                   type={"text"}
  //                   isTextArea
  //                   disabled
  //                 />,
  //                 <FormDropdown
  //                   id={"opportunityDescription"}
  //                   name={"opportunityDescription"}
  //                   label={"opportunity-description"}
  //                   useFormattedStrings={false}
  //                   options={opportunities.map((opportunity) => {
  //                     return {
  //                       label: opportunity.name,
  //                       value: opportunity.name,
  //                     };
  //                   })}
  //                   disabled
  //                 />,
  //                 <FormDropdown
  //                   id={"closer"}
  //                   name={"closer"}
  //                   label={"closer"}
  //                   useFormattedStrings={false}
  //                   options={closers.map((closer) => {
  //                     return {
  //                       label: closer.full_name,
  //                       value: closer.id.toString(),
  //                     };
  //                   })}
  //                   optional={false}
  //                   disabled
  //                   error={touched.closer ? errors.closer : ""}
  //                 />,
  //                 <FormDropdown
  //                   id={"status"}
  //                   name={"status"}
  //                   label={"status"}
  //                   optional={false}
  //                   options={[
  //                     "delivered",
  //                     "cancelled",
  //                     "deposited-twenty-plus",
  //                     "scheduled-for-delivery",
  //                     "on-hold",
  //                     "ready-for-delivery",
  //                   ]}
  //                   disabled
  //                   disabledValues={["delivered"]}
  //                   error={touched.status ? errors.status : ""}
  //                 />,
  //                 <FormDropdown
  //                   id={"show"}
  //                   name={"show"}
  //                   label={"show"}
  //                   useFormattedStrings={false}
  //                   options={shows.map((show) => {
  //                     return {
  //                       label: show.name,
  //                       value: show.id.toString(),
  //                     };
  //                   })}
  //                   optional={false}
  //                   disabled
  //                   error={touched.show ? errors.show : ""}
  //                 />,
  //                 <FormInput
  //                   id={"saleDate"}
  //                   name={"saleDate"}
  //                   placeholder={"Sale Date"}
  //                   label={"sale-date"}
  //                   optional={false}
  //                   type={"date"}
  //                   max={getDateFormattedForField()}
  //                   disabled
  //                   error={touched.saleDate ? errors.saleDate : ""}
  //                 />,
  //                 <FormInput
  //                   id={"followUpNotes"}
  //                   name={"followUpNotes"}
  //                   placeholder={"Follow Up Notes"}
  //                   label={"follow-up-notes"}
  //                   type={"text"}
  //                   isTextArea
  //                   disabled
  //                 />,
  //               ]}
  //             />
  //           </Form>
  //         )}
  //       </Formik>
  //     </>
  //   );
  // }
  return (
    <>
      {!loading && sale?.closed && (
        <Box display={"flex"} paddingBottom={"2rem"}>
          <Typography>
            Warning: This sale has been closed and should not be edited.
          </Typography>
        </Box>
      )}
      {!loading && invoiceCreated && (
        <Box display={"flex"} paddingBottom={"2rem"}>
          <Typography>
            This sale has been invoiced, so it is no longer editable.
          </Typography>
        </Box>
      )}
      <Formik
        enableReinitialize
        initialValues={{
          contactName: sale.contact_name ?? "",
          opportunityDescription: sale.opportunity_description ?? "",
          deposit: sale.deposit ?? "",
          total: sale.total ?? "",
          paymentMethod: sale.payment_method ?? "",
          phone: sale.phone ?? "",
          mobile: sale.mobile ?? "",
          address: sale.address ?? "",
          suburb: sale.suburb ?? "",
          state: sale.state ?? "",
          postCode: sale.post_code ?? "",
          emailAddress: sale.email_address ?? "",
          note: sale.note ?? "",
          salesPerson: sale.sales_person?.id ?? "",
          closer: sale.closer?.id ?? "",
          status: sale.status ?? "",
          show: sale.show?.id ?? "",
          followUpNotes: sale.follow_up_notes ?? "",
          saleDate: getDateFormattedForField(sale.sale_date) ?? "",
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
                  id={"contactName"}
                  name={"contactName"}
                  placeholder={"Contact Name"}
                  label={"contact-name"}
                  optional={false}
                  type={"text"}
                  error={touched.contactName ? errors.contactName : ""}
                  disabled={invoiceCreated}
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
                  error={touched.salesPerson ? errors.salesPerson : ""}
                  disabled={invoiceCreated}
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
                  error={touched.deposit ? errors.deposit : ""}
                  disabled={invoiceCreated}
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
                  error={touched.total ? errors.total : ""}
                  disabled={invoiceCreated}
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
                  disabled={invoiceCreated}
                />,
                <FormInput
                  id={"phone"}
                  name={"phone"}
                  placeholder={"Phone"}
                  label={"phone"}
                  type={"text"}
                  disabled={invoiceCreated}
                />,
                <FormInput
                  id={"mobile"}
                  name={"mobile"}
                  placeholder={"Mobile"}
                  label={"mobile"}
                  type={"text"}
                  disabled={invoiceCreated}
                />,
                <PlacesInput
                  id="address"
                  name="address"
                  placeholder="Address"
                  onChange={changeAddress}
                  value={selectedAddress}
                  label="address"
                  disabled={invoiceCreated}
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
                  disabled={invoiceCreated}
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
                  disabled={invoiceCreated}
                />,
                <FormInput
                  id={"postCode"}
                  name={"postCode"}
                  placeholder={"Post Code"}
                  label={"post-code"}
                  type={"text"}
                  disabled={invoiceCreated}
                />,
                <FormInput
                  id={"emailAddress"}
                  name={"emailAddress"}
                  placeholder={"Email Address"}
                  label={"email-address"}
                  type={"email"}
                  disabled={invoiceCreated}
                />,
                <FormInput
                  id={"note"}
                  name={"note"}
                  placeholder={"Note"}
                  label={"note"}
                  type={"text"}
                  isTextArea
                  disabled={invoiceCreated}
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
                        onChange={(e) => {
                          handleChangeSelectedOpportunities(e, idx);
                        }}
                        options={opportunities.map((opportunity) => {
                          return {
                            label: opportunity.name,
                            value: opportunity.name,
                          };
                        })}
                        disabled={invoiceCreated}
                      />
                      {idx === selectedOpportunities.length - 1 &&
                        opportunity !== "" &&
                        !invoiceCreated && (
                          <IconButton onClick={addSelectedOpportunity}>
                            <Add />
                          </IconButton>
                        )}
                      {idx !== 0 && !invoiceCreated && (
                        <IconButton
                          onClick={() => {
                            removeSelectedOpportunity(idx);
                          }}
                        >
                          <Trash />
                        </IconButton>
                      )}
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
                  error={touched.closer ? errors.closer : ""}
                  disabled={invoiceCreated}
                />,
                <FormDropdown
                  id={"status"}
                  name={"status"}
                  label={"status"}
                  optional={false}
                  options={
                    invoiceCreated
                      ? ["cancelled"]
                      : [
                          "delivered",
                          "cancelled",
                          "deposited-twenty-plus",
                          "scheduled-for-delivery",
                          "on-hold",
                          "ready-for-delivery",
                        ]
                  }
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
                  error={touched.show ? errors.show : ""}
                  disabled={invoiceCreated}
                />,
                <FormInput
                  id={"saleDate"}
                  name={"saleDate"}
                  placeholder={"Sale Date"}
                  label={"sale-date"}
                  optional={false}
                  type={"date"}
                  max={getDateFormattedForField()}
                  error={touched.saleDate ? errors.saleDate : ""}
                  disabled={invoiceCreated}
                />,
                <FormInput
                  id={"followUpNotes"}
                  name={"followUpNotes"}
                  placeholder={"Follow Up Notes"}
                  label={"follow-up-notes"}
                  type={"text"}
                  isTextArea
                  disabled={invoiceCreated}
                />,
              ]}
            />
          </Form>
        )}
      </Formik>
    </>
  );
}
