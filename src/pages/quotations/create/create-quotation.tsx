import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateQuotation } from "./use-create-quotation";
import { getDateFormattedForField } from "utils/helpers";
import CircularLoader from "components/CircularLoader";
import {
  Box,
  useTheme,
  Paper,
  Typography,
  Button,
  Alert,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Container,
} from "@mui/material";
import AddressFields from "components/AddressFields";
import InputDropdown from "components/InputDropdown";
import ItemsSelectionTable from "components/ItemsSelectionTable";
import CreateItemModal from "components/CreateItemModal";
import CustomerFormSync from "components/CustomerFormSync";
import { useState, useCallback } from "react";
import { openSnackbar } from "api/snackbar";
import { SnackbarProps } from "types/snackbar";

// ==============================|| CREATE QUOTATION PAGE ||============================== //

export default function CreateQuotation() {
  const [activeStep, setActiveStep] = useState(0);
  // Step 1 errors are shown once "Next" has been pressed. The messages themselves
  // always come from Formik's live `errors`, so they disappear as soon as the
  // field is filled in instead of sticking around from an older validation run.
  const [showStep1Errors, setShowStep1Errors] = useState(false);
  // One-time delivery address typed on the quotation (not saved to the customer)
  const [customAddress, setCustomAddress] = useState(false);
  // Inline "Create New Item" modal (step 2)
  const [createItemModalOpen, setCreateItemModalOpen] = useState(false);

  const {
    validate,
    onSubmit,
    customers,
    items,
    loading,
    selectedItems,
    addItem,
    addCreatedItemToQuotation,
    removeItem,
    reorderItems,
    updateItem,
    totalAmount,
    handleSearchDebounced,
    loadingCustomers,
    createInlineCustomer,
    setCreateInlineCustomer,
    selectedAddress,
    selectedSuburb,
    selectedState,
    selectedCustomer,
    selectedEmail,
    selectedPhone,
    selectedMobile,
    selectedPostCode,
    selectedItemId,
    setSelectedItemId,
    loadingItems,
    handleItemSearchDebounced,
    selectCustomer,
    selectedCustomerRecord,
    changeAddress,
    inlineCustomerName,
    quotationNumberRef,
    setInlineCustomerName,
    customerName,
    setCustomerName,
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    handleAddressSelect,
    // Discount properties
    discount,
    setDiscount,
    discountType,
    setDiscountType,
    showDiscountInput,
    setShowDiscountInput,
    discountAmount,
    finalAmount,
  } = useCreateQuotation();

  const theme = useTheme();

  const leaveCustomAddressMode = useCallback(() => setCustomAddress(false), []);

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

  const steps = ['Order Information', 'Select Items'];

  const handleNext = (validateForm: any) => {
    validateForm().then((errors: any) => {
      // Check only Step 1 fields for validation
      const step1Fields = [
        'quotation_number',
        'contactName',
        'inlineCustomerName',
      ];

      const step1HasErrors = step1Fields.some(field => errors[field]);
      setShowStep1Errors(step1HasErrors);

      if (!step1HasErrors) {
        setActiveStep(1);
      }
    });
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const warn = (message: string) =>
    openSnackbar({
      open: true,
      message,
      variant: "alert",
      alert: { color: "warning" },
    } as SnackbarProps);

  const handleSubmitStep2 = (handleSubmit: any) => {
    // Validate that at least one item is selected
    if (selectedItems.length === 0) {
      warn('Please add at least one item before submitting.');
      return;
    }

    // Check that all items have warehouses selected
    const hasInvalidItems = selectedItems.some(item => !item.warehouse_id);
    if (hasInvalidItems) {
      warn('Please select a warehouse for all items.');
      return;
    }

    handleSubmit();
  };

  return (
    <Formik
      enableReinitialize={false}
      validateOnMount={false}
      // Errors have to refresh as the form is filled in, otherwise a message
      // raised earlier (e.g. "Contact Name required") stays on screen after the
      // field is populated.
      validateOnChange={true}
      validateOnBlur={true}
      initialValues={{
        quotation_number: String(quotationNumberRef.current),
        contactName: customerName || "",
        inlineCustomerName: inlineCustomerName || "",
        phone: selectedPhone || "",
        mobile: selectedMobile || "",
        address: selectedAddress || "",
        suburb: selectedSuburb || "",
        state: selectedState || "",
        postCode: selectedPostCode || "",
        emailAddress: selectedEmail || "",
        valid_until: "",
        note: "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({
        handleSubmit,
        errors,
        touched,
        isSubmitting,
        values,
        setFieldValue,
        validateForm,
      }) => {
        // Error text for a step 1 field: only after the field was touched or
        // "Next" was pressed, and only while it is actually still invalid.
        const fieldError = (field: string): string =>
          showStep1Errors || (touched as any)[field]
            ? ((errors as any)[field] ?? "")
            : "";

        return (
          <Form onSubmit={handleSubmit}>
            <CustomerFormSync
              selectedCustomer={selectedCustomer}
              selectedCustomerRecord={selectedCustomerRecord}
              createInlineCustomer={createInlineCustomer}
              customerAddresses={customerAddresses}
              selectedAddressIndex={selectedAddressIndex}
              customAddress={customAddress}
              setCustomerName={setCustomerName}
              onCustomerChange={leaveCustomAddressMode}
            />
            <Container maxWidth={activeStep === 1 ? "xl" : "lg"}>
              <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
                {/* Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Step 1: Order Information */}
                {activeStep === 0 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                      Order Information
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="quotation_number"
                          id={"quotation_number"}
                          name={"quotation_number"}
                          placeholder={"Quotation Number"}
                          label="Quote Number"
                          type={"text"}
                          optional={false}
                          disabled={true}
                          error={fieldError("quotation_number")}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="valid_until"
                          id={"valid_until"}
                          name={"valid_until"}
                          placeholder={"Valid Until"}
                          label="Valid Until"
                          type={"date"}
                        />
                      </Grid>

                      {/* Customer Selection */}
                      {!createInlineCustomer ? (
                        <Grid item xs={12}>
                          <InputDropdown
                            key="contactName"
                            id="contactName"
                            name="contactName"
                            label="Contact Name"
                            options={customers}
                            // Bound to the stored record, not to a lookup in the
                            // search results — those change while typing and the
                            // field would blank out mid-search.
                            value={selectedCustomerRecord || null}
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
                                Create New Customer
                              </Box>
                            }
                            loading={loadingCustomers}
                            optional={false}
                            onChange={handleSearchDebounced}
                            // Use the option the dropdown hands over: reading
                            // event.target.value only works for mouse clicks, and
                            // gave a stray value on keyboard select / clear.
                            onSelect={(_e, option) => selectCustomer(option)}
                            error={fieldError("contactName")}
                          />
                        </Grid>
                      ) : (
                        <Grid item xs={12}>
                          <FormInput
                            key="inlineCustomerName"
                            id={"inlineCustomerName"}
                            name={"inlineCustomerName"}
                            placeholder={"Contact Name"}
                            label="Contact Name"
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
                                  setInlineCustomerName("");
                                  setFieldValue("inlineCustomerName", "");
                                }}
                              >
                                Use Existing Customer
                              </Box>
                            }
                            error={fieldError("inlineCustomerName")}
                            onChange={(e) => {
                              setFieldValue("inlineCustomerName", e.target.value);
                              setInlineCustomerName(e.target.value);
                            }}
                            value={values.inlineCustomerName}
                          />
                        </Grid>
                      )}

                      {/* Contact Details */}
                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="emailAddress"
                          id={"emailAddress"}
                          name={"emailAddress"}
                          placeholder={"Email Address"}
                          label="Email Address"
                          type={"email"}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="phone"
                          id={"phone"}
                          name={"phone"}
                          placeholder={"Phone"}
                          label="Phone"
                          type={"text"}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="mobile"
                          id={"mobile"}
                          name={"mobile"}
                          placeholder={"Mobile"}
                          label="Mobile"
                          type={"text"}
                        />
                      </Grid>

                      {/* ADDRESS SECTION */}
                      <Grid item xs={12}>
                        {!createInlineCustomer && selectedCustomer && customerAddresses.length > 0 ? (
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              {!customAddress ? (
                                <FormDropdown
                                  key="address-select"
                                  id={"address-select"}
                                  name={"address-select"}
                                  label="Select Delivery Address"
                                  useFormattedStrings={false}
                                  options={customerAddresses.map((addr, index) => ({
                                    label: `${addr.address}, ${addr.suburb} ${addr.state} ${addr.post_code} ${addr.is_primary ? '(Primary)' : ''}`,
                                    value: index.toString(),
                                  }))}
                                  value={selectedAddressIndex.toString()}
                                  onChange={(e) => {
                                    const index = parseInt(e.target.value);
                                    handleAddressSelect(index);
                                  }}
                                  optional={false}
                                  secondaryLabel={
                                    <Box
                                      sx={{
                                        color: theme.palette.primary.main,
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                      }}
                                      onClick={() => {
                                        setCustomAddress(true);
                                        handleAddressSelect(-1);
                                        setFieldValue("address", "");
                                        setFieldValue("suburb", "");
                                        setFieldValue("state", "");
                                        setFieldValue("postCode", "");
                                      }}
                                    >
                                      Enter a new address
                                    </Box>
                                  }
                                />
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: "0.5rem",
                                  }}
                                >
                                  <Typography sx={{ fontSize: "16px" }}>
                                    New Delivery Address (this quotation only)
                                  </Typography>
                                  <Box
                                    sx={{
                                      color: theme.palette.primary.main,
                                      cursor: "pointer",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                    }}
                                    onClick={() => {
                                      setCustomAddress(false);
                                      handleAddressSelect(
                                        selectedAddressIndex >= 0 ? selectedAddressIndex : 0,
                                      );
                                    }}
                                  >
                                    Use saved address
                                  </Box>
                                </Box>
                              )}
                            </Grid>

                            <AddressFields
                              variant="document"
                              values={values}
                              setFieldValue={setFieldValue}
                              changeAddress={changeAddress}
                            />
                          </Grid>
                        ) : (
                          // For inline customers or customers without addresses
                          <Box>
                            {!createInlineCustomer && selectedCustomer && customerAddresses.length === 0 ? (
                              <Alert severity="info" sx={{ mb: 2 }}>
                                No addresses found for this customer. Please enter address manually below.
                              </Alert>
                            ) : null}

                            <Grid container spacing={2}>
                              <AddressFields
                                variant="document"
                                values={values}
                                setFieldValue={setFieldValue}
                                changeAddress={changeAddress}
                              />
                            </Grid>
                          </Box>
                        )}
                      </Grid>

                      {/* NOTES */}
                      <Grid item xs={12}>
                        <FormInput
                          key="note"
                          id={"note"}
                          name={"note"}
                          placeholder={"Notes"}
                          label={"Notes"}
                          type={"text"}
                          isTextArea
                        />
                      </Grid>
                    </Grid>

                    {/* Next Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={() => handleNext(validateForm)}
                        size="large"
                      >
                        Next: Select Items
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Step 2: Select Items */}
                {activeStep === 1 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                      Select Items
                    </Typography>
                    {/* Use shared ItemsSelectionTable component */}
                    <ItemsSelectionTable
                      items={items}
                      selectedItems={selectedItems}
                      addItem={addItem}
                      removeItem={removeItem}
                      reorderItems={reorderItems}
                      updateItem={updateItem}
                      totalAmount={totalAmount}
                      loadingItems={loadingItems}
                      handleItemSearchDebounced={handleItemSearchDebounced}
                      selectedItemId={selectedItemId}
                      setSelectedItemId={setSelectedItemId}
                      showDiscount={true}
                      discount={discount}
                      setDiscount={setDiscount}
                      discountType={discountType}
                      setDiscountType={setDiscountType}
                      showDiscountInput={showDiscountInput}
                      setShowDiscountInput={setShowDiscountInput}
                      discountAmount={discountAmount}
                      finalAmount={finalAmount}
                      onCreateNewItemClick={() => setCreateItemModalOpen(true)}
                    />

                    {/* Navigation Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                      <Button
                        variant="outlined"
                        onClick={handleBack}
                        size="large"
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handleSubmitStep2(handleSubmit)}
                        disabled={isSubmitting}
                        size="large"
                      >
                        {isSubmitting ? 'Creating Quotation...' : 'Create Quotation'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Container>

            {/* Inline item creation (step 2) — creates the item and adds it to the quotation */}
            <CreateItemModal
              open={createItemModalOpen}
              onClose={() => setCreateItemModalOpen(false)}
              onCreated={addCreatedItemToQuotation}
            />
          </Form>
        );
      }}
    </Formik>
  );
}