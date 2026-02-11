import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditQuotation } from "./use-edit-quotation";
import { australianStates } from "utils/helpers";
import CircularLoader from "components/CircularLoader";
import {
  Box,
  Paper,
  Typography,
  Button,
  useTheme,
  Alert,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Container,
} from "@mui/material";
import PlacesInput from "components/PlacesInput";
import ItemsSelectionTable from "components/ItemsSelectionTable";
import { useParams, useNavigate } from "react-router-dom";
import ActionButton from "components/ActionButton";
import { useEffect, useState } from "react";

// ==============================|| EDIT QUOTATION PAGE ||============================== //

export default function EditQuotation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [step1Errors, setStep1Errors] = useState<any>({});

  const {
    validate,
    onSubmit,
    items,
    loading,
    selectedItems,
    addItem,
    removeItem,
    updateItem,
    totalAmount,
    loadingItems,
    selectedAddress,
    selectedSuburb,
    selectedState,
    selectedEmail,
    selectedPhone,
    selectedMobile,
    selectedPostCode,
    changeAddress,
    selectedItemId,
    setSelectedItemId,
    handleItemSearchDebounced,
    initialValues,
    currentStatus,
    quotationData,
    customerName,
    setCustomerName,
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    handleAddressSelect,
    customerId,
  } = useEditQuotation(id ? parseInt(id) : 0);

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

  if (!quotationData && !loading) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h6">Quotation not found</Typography>
        <ActionButton
          text="Back to Quotations"
          onClick={() => navigate("/quotations")}
        />
      </Box>
    );
  }

  // Check if quotation can be edited
  const isEditable = currentStatus === "draft" || currentStatus === "sent";

  if (!isEditable) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 2,
          p: 3,
        }}
      >
        <Typography variant="h6" color="error">
          This quotation cannot be edited
        </Typography>
        <Typography variant="body1" textAlign="center">
          Only draft and sent quotations can be edited.
          <br />
          Current status:{" "}
          <strong>
            {currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1)}
          </strong>
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <ActionButton
            text="Back to Quotations"
            onClick={() => navigate("/quotations")}
          />
        </Box>
      </Box>
    );
  }

  const steps = ['Quotation Details', 'Select Items'];

  const handleBack = () => {
    setActiveStep(0);
  };

  return (
    <Formik
      enableReinitialize={false}
      validateOnMount={false}
      validateOnChange={false}
      validateOnBlur={true}
      initialValues={initialValues}
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
        // Navigation functions for stepper
        const handleNext = () => {
          validateForm().then((validationErrors: any) => {
            // Check only Step 1 fields for validation
            const step1Fields = [
              'quotation_number',
              'status',
              'customerName',
            ];

            const step1HasErrors = step1Fields.some(field => validationErrors[field]);

            if (!step1HasErrors) {
              setStep1Errors({});
              setActiveStep(1);
            } else {
              setStep1Errors(validationErrors);
            }
          });
        };

        const handleSubmitStep2 = () => {
          // Validate that at least one item is selected
          if (selectedItems.length === 0) {
            alert('Please add at least one item before updating.');
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

                {/* Step 1: Quotation Details */}
                {activeStep === 0 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                      Quotation Details
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
                          error={touched.quotation_number || step1Errors.quotation_number ? errors.quotation_number || step1Errors.quotation_number : ""}
                          disabled
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormDropdown
                          key="status"
                          id={"status"}
                          name={"status"}
                          label="Status"
                          options={[
                            { label: "Draft", value: "draft" },
                            { label: "Sent", value: "sent" },
                            { label: "Approved", value: "approved" },
                            { label: "Cancelled", value: "cancelled" },
                          ]}
                          optional={false}
                          error={touched.status || step1Errors.status ? errors.status || step1Errors.status : ""}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="customerName"
                          id={"customerName"}
                          name={"customerName"}
                          placeholder={"Customer Name"}
                          label="Customer Name"
                          type={"text"}
                          optional={false}
                          error={touched.customerName || step1Errors.customerName ? errors.customerName || step1Errors.customerName : ""}
                          value={values.customerName}
                          onChange={(e) => {
                            setFieldValue("customerName", e.target.value);
                            setCustomerName(e.target.value);
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="emailAddress"
                          id={"emailAddress"}
                          name={"emailAddress"}
                          placeholder={"Email Address"}
                          label="Email Address"
                          type={"email"}
                          value={values.emailAddress}
                          onChange={(e) => {
                            setFieldValue("emailAddress", e.target.value);
                          }}
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
                          value={values.phone}
                          onChange={(e) => {
                            setFieldValue("phone", e.target.value);
                          }}
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
                          value={values.mobile}
                          onChange={(e) => {
                            setFieldValue("mobile", e.target.value);
                          }}
                        />
                      </Grid>

                      {/* ADDRESS SECTION */}
                      <Grid item xs={12}>
                        {customerId && customerAddresses.length > 0 ? (
                          // For existing customers with addresses - Show address selection
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
                                  changeAddress(newValue, actionMeta);
                                  setFieldValue(
                                    "address",
                                    newValue?.value?.description ?? ""
                                  );
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
                          // For customers without addresses or manual entry
                          <Box>
                            {customerId && customerAddresses.length === 0 ? (
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
                                    changeAddress(newValue, actionMeta);
                                    setFieldValue(
                                      "address",
                                      newValue?.value?.description ?? ""
                                    );
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

                      {/* VALID UNTIL DATE */}
                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="valid_until"
                          id={"valid_until"}
                          name={"valid_until"}
                          placeholder={"Valid Until"}
                          label="Valid Until"
                          type={"date"}
                          value={values.valid_until}
                          onChange={(e) => {
                            setFieldValue("valid_until", e.target.value);
                          }}
                        />
                      </Grid>

                      {/* NOTES */}
                      <Grid item xs={12}>
                        <FormInput
                          key="note"
                          id={"note"}
                          name={"note"}
                          placeholder={"Notes"}
                          label="Notes"
                          type={"text"}
                          isTextArea
                          value={values.note}
                          onChange={(e) => {
                            setFieldValue("note", e.target.value);
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Navigation Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate("/quotations")}
                        size="large"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleNext}
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
                      updateItem={updateItem}
                      totalAmount={totalAmount}
                      loadingItems={loadingItems}
                      handleItemSearchDebounced={handleItemSearchDebounced}
                      selectedItemId={selectedItemId}
                      setSelectedItemId={setSelectedItemId}
                      showDiscount={false}
                    />

                    {/* Navigation Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={handleBack}
                          size="large"
                        >
                          Back
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => navigate("/quotations")}
                          size="large"
                        >
                          Cancel
                        </Button>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={handleSubmitStep2}
                        disabled={isSubmitting}
                        size="large"
                      >
                        {isSubmitting ? 'Updating Quotation...' : 'Update Quotation'}
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