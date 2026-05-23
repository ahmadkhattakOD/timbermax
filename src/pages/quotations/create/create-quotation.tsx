import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateQuotation } from "./use-create-quotation";
import { australianStates, getDateFormattedForField } from "utils/helpers";
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
import PlacesInput from "components/PlacesInput";
import InputDropdown from "components/InputDropdown";
import ItemsSelectionTable from "components/ItemsSelectionTable";
import { useState, useEffect } from "react";

// ==============================|| CREATE QUOTATION PAGE ||============================== //

export default function CreateQuotation() {
  const [activeStep, setActiveStep] = useState(0);
  const [step1Errors, setStep1Errors] = useState<any>({});

  const {
    validate,
    onSubmit,
    customers,
    items,
    loading,
    selectedItems,
    addItem,
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
    setSelectedCustomer,
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

      if (!step1HasErrors) {
        setStep1Errors({});
        setActiveStep(1);
      } else {
        setStep1Errors(errors);
      }
    });
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleSubmitStep2 = (handleSubmit: any) => {
    // Validate that at least one item is selected
    if (selectedItems.length === 0) {
      alert('Please add at least one item before submitting.');
      return;
    }

    // Check that all items have warehouses selected
    const hasInvalidItems = selectedItems.some(item => !item.warehouse_id);
    if (hasInvalidItems) {
      alert('Please select a warehouse for all items.');
      return;
    }

    handleSubmit();
  };

  return (
    <Formik
      enableReinitialize={false}
      validateOnMount={false}
      validateOnChange={false}
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
        useEffect(() => {
          if (selectedCustomer) {
            const customer = customers.find((c) => c.id === selectedCustomer);
            if (customer) {
              // Update Formik values
              setFieldValue("contactName", customer.name || "");
              setCustomerName(customer.name || "");
              setFieldValue("phone", customer.phone || "");
              setFieldValue("mobile", customer.mobile || "");
              setFieldValue("emailAddress", customer.email || "");
            }
          } else if (!createInlineCustomer) {
            // Reset Formik values when no customer selected
            setFieldValue("contactName", "");
            setCustomerName("");
            setFieldValue("phone", "");
            setFieldValue("mobile", "");
            setFieldValue("address", "");
            setFieldValue("suburb", "");
            setFieldValue("state", "");
            setFieldValue("postCode", "");
            setFieldValue("emailAddress", "");
          }
        }, [
          selectedCustomer,
          customers,
          createInlineCustomer,
          setFieldValue,
          setCustomerName,
        ]);

        // When an address is selected from dropdown, populate all address fields
        useEffect(() => {
          if (selectedAddressIndex !== -1 && customerAddresses.length > 0) {
            const selectedAddr = customerAddresses[selectedAddressIndex];
            setFieldValue("address", selectedAddr.address || "");
            setFieldValue("suburb", selectedAddr.suburb || "");
            setFieldValue("state", selectedAddr.state || "");
            setFieldValue("postCode", selectedAddr.post_code || "");
          }
        }, [selectedAddressIndex, customerAddresses, setFieldValue]);

        return (
          <Form onSubmit={handleSubmit}>
            <Container maxWidth="lg">
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
                          error={
                            touched.quotation_number || step1Errors.quotation_number ? errors.quotation_number || step1Errors.quotation_number : ""
                          }
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
                            value={
                              customers.find((c) => c.id === selectedCustomer) || null
                            }
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
                            onSelect={(e) => {
                              setSelectedCustomer(e.target.value);
                            }}
                            error={errors.contactName || step1Errors.contactName}
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
                            error={
                              (touched.inlineCustomerName || step1Errors.inlineCustomerName)
                                ? (errors.inlineCustomerName || step1Errors.inlineCustomerName)
                                : ""
                            }
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
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <PlacesInput
                                key="address"
                                id="address"
                                name="address"
                                placeholder="Address"
                                onChange={(newValue, actionMeta) => {
                                  setFieldValue(
                                    "address",
                                    newValue?.value?.description ?? ""
                                  );
                                  changeAddress(newValue, actionMeta, setFieldValue);
                                }}
                                value={values.address}
                                label="Address"
                              />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                              <FormInput
                                key="suburb"
                                id={"suburb"}
                                name={"suburb"}
                                placeholder={"Suburb"}
                                label="Suburb"
                                type={"text"}
                                value={values.suburb}
                                onChange={(e) => setFieldValue("suburb", e.target.value)}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                              <FormDropdown
                                key="state"
                                id={"state"}
                                name={"state"}
                                label="State"
                                useFormattedStrings={false}
                                options={australianStates.map((state) => ({
                                  label: state,
                                  value: state,
                                }))}
                                value={values.state}
                                onChange={(e) => setFieldValue("state", e.target.value)}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                              <FormInput
                                key="postCode"
                                id={"postCode"}
                                name={"postCode"}
                                placeholder={"Post Code"}
                                label="Post Code"
                                type={"text"}
                                value={values.postCode}
                                onChange={(e) => setFieldValue("postCode", e.target.value)}
                              />
                            </Grid>
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
                              <Grid item xs={12} md={6}>
                                <PlacesInput
                                  key="address"
                                  id="address"
                                  name="address"
                                  placeholder="Address"
                                  onChange={(newValue, actionMeta) => {
                                    setFieldValue(
                                      "address",
                                      newValue?.value?.description ?? ""
                                    );
                                    changeAddress(newValue, actionMeta, setFieldValue);
                                  }}
                                  value={values.address}
                                  label="Address"
                                />
                              </Grid>

                              <Grid item xs={12} sm={6} md={3}>
                                <FormInput
                                  key="suburb"
                                  id={"suburb"}
                                  name={"suburb"}
                                  placeholder={"Suburb"}
                                  label="Suburb"
                                  type={"text"}
                                  value={values.suburb}
                                  onChange={(e) => setFieldValue("suburb", e.target.value)}
                                />
                              </Grid>

                              <Grid item xs={12} sm={6} md={3}>
                                <FormDropdown
                                  key="state"
                                  id={"state"}
                                  name={"state"}
                                  label="State"
                                  useFormattedStrings={false}
                                  options={australianStates.map((state) => ({
                                    label: state,
                                    value: state,
                                  }))}
                                  value={values.state}
                                  onChange={(e) => setFieldValue("state", e.target.value)}
                                />
                              </Grid>

                              <Grid item xs={12} sm={6} md={3}>
                                <FormInput
                                  key="postCode"
                                  id={"postCode"}
                                  name={"postCode"}
                                  placeholder={"Post Code"}
                                  label="Post Code"
                                  type={"text"}
                                  value={values.postCode}
                                  onChange={(e) => setFieldValue("postCode", e.target.value)}
                                />
                              </Grid>
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
          </Form>
        );
      }}
    </Formik>
  );
}