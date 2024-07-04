// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateSale } from "./useCreateSale";
import {
  australianStates,
  getDateFormatted,
  getDateFormattedForField,
} from "utils/helpers";
import { Box } from "@mui/material";
import CircularLoader from "components/CircularLoader";
import { IconButton } from "@mui/material";
import { Add, NoteRemove, Trash } from "iconsax-react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

// ==============================|| CREATE SALE PAGE ||============================== //

export default function CreateSale() {
  const {
    validate,
    onSubmit,
    salesPersons,
    closers,
    shows,
    opportunities,
    loading,
    selectedOpportunities,
    handleChangeSelectedOpportunities,
    addSelectedOpportunity,
    removeSelectedOpportunity,
    changeAddress,
  } = useCreateSale();

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
        contactName: "",
        deposit: "",
        total: "",
        paymentMethod: "",
        phone: "",
        mobile: "",
        address: "",
        suburb: "",
        state: "",
        postCode: "",
        emailAddress: "",
        note: "",
        salesPerson: "",
        closer: "",
        status: "",
        show: "",
        followUpNotes: "",
        saleDate: getDateFormattedForField(),
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting, values }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"add"}
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
                options={salesPersons.map((salesPerson) => {
                  return {
                    label: salesPerson.full_name,
                    value: salesPerson.id.toString(),
                  };
                })}
                optional={false}
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
              <FormInput
                id={"suburb"}
                name={"suburb"}
                placeholder={"Suburb"}
                label={"suburb"}
                type={"text"}
              />,
              // <GooglePlacesAutocomplete
              //   apiKey={import.meta.env.VITE_APP_MAPS_KEY}
              //   autocompletionRequest={{
              //     componentRestrictions: { country: ["au"] },
              //   }}
              //   debounce={750}
              //   minLengthAutocomplete={3}
              //   selectProps={{
              //     onChange: changeAddress,
              //     styles: {
              //       control: (provided) => ({
              //         ...provided,
              //         borderRadius: "8px",
              //         border: "1px solid lightgray",
              //         ":focus": {
              //           border: `1px solid red`,
              //           boxShadow: `0 0 0 2px rgba(70, 128, 255, 0.1)`,
              //           outline: "none",
              //           backgroundColor: "transparent",
              //         },
              //       }),
              //       dropdownIndicator: (provided) => ({
              //         ...provided,
              //         display: "none",
              //       }),
              //       indicatorSeparator: () => ({
              //         display: "none",
              //       }),
              //       input: (provided) => ({
              //         ...provided,
              //         color: "black",
              //         backgroundColor: "transparent !important",
              //         fontSize: "14px",
              //         paddingTop: "0.4rem",
              //         paddingBottom: "0.4rem",
              //         border: `none`,
              //         borderRadius: "8px",
              //         flex: 1,
              //         width: "100%",
              //       }),
              //     },
              //   }}
              // />,
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
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
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
                      label={idx === 0 ? "opportunity-description" : undefined}
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
                    />
                    {idx === selectedOpportunities.length - 1 &&
                      opportunity !== "" && (
                        <IconButton onClick={addSelectedOpportunity}>
                          <Add />
                        </IconButton>
                      )}
                    {idx !== 0 && (
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
