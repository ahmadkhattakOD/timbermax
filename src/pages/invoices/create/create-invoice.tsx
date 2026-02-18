import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateInvoice } from "./useCreateInvoice";
import {
  australianStates,
  getDateFormattedForField,
} from "utils/helpers";
import CircularLoader from "components/CircularLoader";
import {
  Box,
  useTheme,
  Typography,
  Button,
  Alert,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Container,
  Paper,
} from "@mui/material";
import PlacesInput from "components/PlacesInput";
import InputDropdown from "components/InputDropdown";
import ItemsSelectionTable from "components/ItemsSelectionTable";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// ==============================|| CREATE INVOICE PAGE ||============================== //

export default function CreateInvoice() {
  const [searchParams] = useSearchParams();
  const quotationIdFromUrl = searchParams.get("quotation_id");
  const [activeStep, setActiveStep] = useState(0);
  const [step1Errors, setStep1Errors] = useState<any>({});

  const {
    validate,
    onSubmit,
    customers,
    items,
    warehouses,
    quotations,
    loading,
    selectedItems,
    addItem,
    removeItem,
    updateItem,
    totalAmount,
    handleSearchDebounced,
    loadingCustomers,
    createInlineCustomer,
    setCreateInlineCustomer,
    selectedAddress,
    selectedSuburb,
    selectedState,
    selectedEmail,
    selectedPhone,
    selectedMobile,
    selectedPostCode,
    selectedCustomer,
    loadFromQuotation,
    selectedQuotation,
    isQuotationLoaded,
    setSelectedItems,
    setIsQuotationLoaded,
    handleItemSearchDebounced,
    loadingItems,
    selectedItemId,
    setSelectedItemId,
    inlineCustomerName,
    setInlineCustomerName,
    changeAddress,
    setSelectedCustomer,
    customerName,
    setCustomerName,
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    handleAddressSelect,
    // Discount properties
    discount,
    setDiscount,
    showDiscountInput,
    setShowDiscountInput,
    discountAmount,
    finalAmount,
    // Quotation search properties
    handleQuotationSearchDebounced,
    loadingQuotations,
  } = useCreateInvoice();

  const theme = useTheme();

  // Auto-load quotation if ID is in URL
  useEffect(() => {
    if (quotationIdFromUrl && !isQuotationLoaded) {
      const quotationId = parseInt(quotationIdFromUrl);
      if (quotationId) {
        loadFromQuotation(quotationId);
      }
    }
  }, [quotationIdFromUrl, isQuotationLoaded, loadFromQuotation]);

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
        'invoice_number',
        'contactName',
        'inlineCustomerName',
        'invoice_date',
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
        invoice_number: `INV-${String(Date.now()).slice(-6)}`,
        contactName: customerName || "",
        inlineCustomerName: inlineCustomerName || "",
        phone: selectedPhone || "",
        mobile: selectedMobile || "",
        address: selectedAddress || "",
        suburb: selectedSuburb || "",
        state: selectedState || "",
        postCode: selectedPostCode || "",
        emailAddress: selectedEmail || "",
        invoice_date: getDateFormattedForField(),
        due_date: "",
        note: "",
        quotation_id: quotationIdFromUrl || "",
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
        // Auto-populate customer details when selected
        useEffect(() => {
          if (selectedCustomer) {
            const customer = customers.find((c) => c.id === selectedCustomer);
            if (customer) {
              // Update Formik values
              setFieldValue("contactName", customer.name || "");
              setCustomerName(customer.name || "");
              setFieldValue("phone", customer.phone || "");
              setFieldValue("mobile", customer.mobile || "");
              setFieldValue("address", customer.address || "");
              setFieldValue("suburb", customer.suburb || "");
              setFieldValue("state", customer.state || "");
              setFieldValue("postCode", customer.post_code || "");
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
                          key="invoice_number"
                          id={"invoice_number"}
                          name={"invoice_number"}
                          placeholder={"Invoice Number"}
                          label={"Invoice Number"}
                          type={"text"}
                          optional={false}
                          error={touched.invoice_number || step1Errors.invoice_number ? errors.invoice_number || step1Errors.invoice_number : ""}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="invoice_date"
                          id={"invoice_date"}
                          name={"invoice_date"}
                          placeholder={"Invoice Date"}
                          label={"Invoice Date"}
                          type={"date"}
                          optional={false}
                          error={touched.invoice_date || step1Errors.invoice_date ? errors.invoice_date || step1Errors.invoice_date : ""}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="due_date"
                          id={"due_date"}
                          name={"due_date"}
                          placeholder={"Due Date"}
                          label={"Due Date"}
                          type={"date"}
                          optional={true}
                        />
                      </Grid>

                      {/* Show quotation info if loaded from quotation */}
                      {selectedQuotation && (
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              mb: 2,
                              p: 2,
                              border: "1px solid",
                              borderColor: "primary.main",
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="h6" gutterBottom color="primary">
                              Creating Invoice from Quotation
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                              <Typography variant="body2">
                                <strong>Quotation:</strong> #
                                {selectedQuotation.quotation_number}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Customer:</strong>{" "}
                                {selectedQuotation.customers?.name}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Total:</strong> $
                                {selectedQuotation.total?.toFixed(2)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Items:</strong> {selectedItems.length}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}

                      {/* OPTION TO LOAD FROM QUOTATION */}
                      {!quotationIdFromUrl && (
                        <Grid item xs={12}>
                          <InputDropdown
                            key="quotation_id"
                            id="quotation_id"
                            name="quotation_id"
                            label="Load from Quotation (Optional)"
                            options={quotations.map((q) => ({
                              id: q.id,
                              name: `#${q.quotation_number} - ${q.customer?.name || "Unknown"} - $${q.total?.toFixed(2)}`,
                            }))}
                            value={
                              selectedQuotation
                                ? {
                                    id: selectedQuotation.id,
                                    name: `#${selectedQuotation.quotation_number} - ${selectedQuotation.customers?.name || "Unknown"} - $${selectedQuotation.total?.toFixed(2)}`,
                                  }
                                : null
                            }
                            loading={loadingQuotations}
                            optional={true}
                            onChange={handleQuotationSearchDebounced}
                            onSelect={(e) => {
                              const quotationId = parseInt(e.target.value);
                              if (quotationId) {
                                loadFromQuotation(quotationId);
                              }
                            }}
                            secondaryLabel={
                              selectedQuotation ? (
                                <Box
                                  sx={{
                                    color: theme.palette.primary.main,
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                  }}
                                  onClick={() => {
                                    setSelectedItems([]);
                                    setIsQuotationLoaded(false);
                                    setSelectedCustomer(undefined);
                                    setCustomerName("");
                                    setFieldValue("contactName", "");
                                  }}
                                >
                                  Clear Quotation
                                </Box>
                              ) : null
                            }
                          />
                        </Grid>
                      )}

                      {/* Customer Selection */}
                      {!createInlineCustomer ? (
                        <Grid item xs={12}>
                          <InputDropdown
                            key="contactName"
                            id="contactName"
                            name="contactName"
                            label="Customer Name"
                            options={customers}
                            value={
                              customers.find((c) => c.id === selectedCustomer) || null
                            }
                            secondaryLabel={
                              !selectedQuotation ? (
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
                              ) : null
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
                            placeholder={"Customer Name"}
                            label="Customer Name"
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
                      updateItem={updateItem}
                      totalAmount={totalAmount}
                      loadingItems={loadingItems}
                      handleItemSearchDebounced={handleItemSearchDebounced}
                      selectedItemId={selectedItemId}
                      setSelectedItemId={setSelectedItemId}
                      showDiscount={true}
                      discount={discount}
                      setDiscount={setDiscount}
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
                        {isSubmitting ? 'Creating Invoice...' : 'Create Invoice'}
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