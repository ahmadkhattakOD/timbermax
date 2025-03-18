// project-imports
import FormLayout from "components/FormLayout";
import { ErrorMessage, Field, Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateSale } from "./useCreateSale";
import { australianStates, getDateFormattedForField } from "utils/helpers";
import CircularLoader from "components/CircularLoader";
import { Box, IconButton, useTheme } from "@mui/material";
import { Add, Trash } from "iconsax-react";
import PlacesInput from "components/PlacesInput";
import InputDropdown from "components/InputDropdown";
import { useState } from "react";

// ==============================|| CREATE SALE PAGE ||============================== //

export default function CreateSale() {
  const {
    validate,
    onSubmit,
    customers,
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
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
    selectedEmail,
    setSelectedEmail,
    selectedPhone,
    setSelectedPhone,
    selectedMobile,
    setSelectedMobile,
    selectedPostCode,
    setSelectedPostCode,
    setSelectedCustomer,
    handleSearchDebounced,
    loadingCustomers,
    createInlineCustomer,
    setCreateInlineCustomer,
    searchOpportunity,
    setSearchOpportunity,
    containCpap,
    setContainCpap,
    isCpapPickup,
    setIsCpapPickup,
  } = useCreateSale();

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
    <Formik
      enableReinitialize
      initialValues={{
        contactName: "",
        inlineCustomerName: "",
        deposit: "",
        cpapAmount: "",
        is_cpap_pickup: "",
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
        milestone: "",
        expectedCloseDate: "",
        lostReason: "",
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
              !createInlineCustomer ? (
                <InputDropdown
                  id="contactName"
                  name="contactName"
                  label="contact-name"
                  options={customers}
                  secondaryLabel={
                    <Box
                      sx={{
                        color: theme.palette.primary.main,
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        setCreateInlineCustomer(true);
                      }}
                    >
                      Create Manually
                    </Box>
                  }
                  loading={loadingCustomers}
                  optional={false}
                  onChange={handleSearchDebounced}
                  onSelect={(e) => {
                    setSelectedCustomer(e.target.value);
                  }}
                  onClickCreateNew={() => {
                    setCreateInlineCustomer(true);
                  }}
                  error={errors.contactName}
                />
              ) : null,
              createInlineCustomer ? (
                <FormInput
                  id={"inlineCustomerName"}
                  name={"inlineCustomerName"}
                  placeholder={"Contact Name"}
                  label={"contact-name"}
                  type={"text"}
                  secondaryLabel={
                    <Box
                      sx={{
                        color: theme.palette.primary.main,
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        setCreateInlineCustomer(false);
                      }}
                    >
                      Cancel Manual
                    </Box>
                  }
                  error={
                    touched.inlineCustomerName ? errors.inlineCustomerName : ""
                  }
                />
              ) : null,
              <FormDropdown
                id={"salesPerson"}
                name={"salesPerson"}
                label={"sales-person"}
                useFormattedStrings={false}
                options={salesPersons
                  .sort((a,b)=>a.full_name.localeCompare(b.full_name))
                  .map((salesPerson) => {
                  return {
                    label: salesPerson.full_name,
                    value: salesPerson.id.toString(),
                  };
                })}
                optional={false}
                error={touched.salesPerson ? errors.salesPerson : ""}
              />,
              <label>
                <Field
                  id="cpap_checkbox"
                  type="checkbox"
                  name="containCpap"
                  onClick={() => setContainCpap(!containCpap)}
                />
                Does this Sale contain cpap?
              </label>,
              containCpap && (
                <div className="flex flex-wrap">
                  <div>
                    <FormInput
                      id={"cpapAmount"}
                      name={"cpapAmount"}
                      placeholder={"cpapAmount"}
                      
                      label={"Cpap Amount"}
                      optional={false}
                      type={"number"}
                      min={0}
                      error={touched.deposit ? errors.deposit : ""}
                    />
                    ,
                    <ErrorMessage name="cpapAmount" component="div" />
                  </div>
                  <div>
                    <FormDropdown
                      id={"is_cpap_pickup"}
                      name={"is_cpap_pickup"}
                      onChange={(e) => setIsCpapPickup(e.target.value)}
                      options={["Yes", "No"]}
                      label={"Is Cpap Piked up?"}
                      useFormattedStrings={true}
                      optional={false}
                      error={touched.deposit ? errors.deposit : ""}
                    />
                    ,
                    <ErrorMessage name="is_cpap_pickedup" component="div" />
                  </div>
                </div>
              ),
              <FormInput
                id={"deposit"}
                name={"deposit"}
                placeholder={"Deposit"}
                label={"deposit"}
                secondaryLabel={
                  values.deposit && values.total
                    ? `${(
                        ((parseFloat(values.deposit) -
                          (values.cpapAmount
                            ? parseFloat(values.cpapAmount)
                            : 0)) /
                          (parseFloat(values.total) -
                            (values.cpapAmount
                              ? parseFloat(values.cpapAmount)
                              : 0))) *
                        100
                      ).toFixed(2)}%`
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
                value={selectedPhone}
                onChange={(e) => {
                  setSelectedPhone(e.target.value);
                }}
              />,
              <FormInput
                id={"mobile"}
                name={"mobile"}
                placeholder={"Mobile"}
                label={"mobile"}
                type={"text"}
                value={selectedMobile}
                onChange={(e) => {
                  setSelectedMobile(e.target.value);
                }}
              />,
              <PlacesInput
                id="address"
                name="address"
                placeholder="Address"
                onChange={changeAddress}
                value={selectedAddress}
                label="address"
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
              />,
              <FormInput
                id={"postCode"}
                name={"postCode"}
                placeholder={"Post Code"}
                label={"post-code"}
                type={"text"}
                value={selectedPostCode}
                onChange={(e) => {
                  setSelectedPostCode(e.target.value);
                }}
              />,
              <FormInput
                id={"emailAddress"}
                name={"emailAddress"}
                placeholder={"Email Address"}
                label={"email-address"}
                type={"email"}
                value={selectedEmail}
                onChange={(e) => {
                  setSelectedEmail(e.target.value);
                }}
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
            {(selectedOpportunities.length === 0 ? [{}] : selectedOpportunities).map((opportunity, idx) => (
  <Box
    key={idx}
    sx={{
      display: "flex",
      gap: "0.5rem",
      flexDirection: "row",
      alignItems: "flex-end",
    }}
  >
    <InputDropdown
      options={opportunities
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((opportunity) =>
          opportunity.name.toLowerCase().includes(searchOpportunity.toLowerCase())
        )}
      id={`opportunityDescription_${idx}`}
      name={`opportunityDescription_${idx}`}
      label={idx === 0 ? "opportunity-description" : undefined}
      loading={loading}
      onChange={(e) => {
        setSearchOpportunity(e.target.value);
      }}
      onSelect={(e) =>
        handleChangeSelectedOpportunities(e, idx)
      }
    />
    {idx === selectedOpportunities.length - 1 && opportunity !== "" && (
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
                options={closers
                  .sort((a,b)=>a.full_name.localeCompare(b.full_name))
                  .map((closer) => {
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
                options={
                  parseFloat(values.deposit) >= parseFloat(values.total) * 0.2
                    ? [
                        "delivered",
                        "cancelled",
                        "deposited-twenty-plus",
                        "scheduled-for-delivery",
                        "on-hold",
                        "ready-for-delivery",
                      ]
                    : [
                        "delivered",
                        "cancelled",
                        "scheduled-for-delivery",
                        "on-hold",
                        "ready-for-delivery",
                      ]
                }
                disabledValues={["delivered"]}
                error={touched.status ? errors.status : ""}
              />,
              <FormDropdown
                id={"milestone"}
                name={"milestone"}
                label={"milestone"}
                options={["won", "in-progress", "lost"]}
              />,
              values.milestone === "lost" ? (
                <FormInput
                  id={"lostReason"}
                  name={"lostReason"}
                  placeholder={"Lost Reason"}
                  label={"lost-reason"}
                  type={"text"}
                  isTextArea
                />
              ) : null,
              <FormInput
                id={"expectedCloseDate"}
                name={"expectedCloseDate"}
                placeholder={"Expected Close Date"}
                label={"expected-close-date"}
                type={"date"}
                error={
                  touched.expectedCloseDate ? errors.expectedCloseDate : ""
                }
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
