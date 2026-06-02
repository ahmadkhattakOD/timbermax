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
  // One-time delivery address typed on the invoice (not saved to the customer)
  const [customAddress, setCustomAddress] = useState(false);

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
    customerAddresses,
    selectedAddressIndex,
    handleAddressSelect,
    discount,
    setDiscount,
    discountType,
    setDiscountType,
    showDiscountInput,
    setShowDiscountInput,
    discountAmount,
    finalAmount,
    deposit,
    setDeposit,
    handleQuotationSearchDebounced,
    loadingQuotations,
    nextInvoiceNumber,
  } = useCreateInvoice();

  const theme = useTheme();

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

  const steps = ["Order Information", "Select Items"];

  const handleNext = (validateForm: any) => {
    validateForm().then((errors: any) => {
      const step1Fields = [
        "invoice_number",
        "contactName",
        "inlineCustomerName",
        "invoice_date",
        "due_date",
      ];
      const step1HasErrors = step1Fields.some((field) => errors[field]);
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
    if (selectedItems.length === 0) {
      alert("Please add at least one item before submitting.");
      return;
    }
    const hasInvalidItems = selectedItems.some((item) => !item.warehouse_id);
    if (hasInvalidItems) {
      alert("Please select a warehouse for all items.");
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
        invoice_number: nextInvoiceNumber || "INV-0400",
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
          // Leave one-time-address mode whenever the customer changes
          setCustomAddress(false);
          if (selectedCustomer) {
            const customer = customers.find((c) => c.id === selectedCustomer);
            if (customer) {
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

        // Shared address fields – used in both address-select and manual modes
        const AddressFields = () => (
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <Grid item xs={12}>
              <PlacesInput
                key="address"
                id="address"
                name="address"
                placeholder="Address"
                onChange={(newValue, actionMeta) => {
                  setFieldValue("address", newValue?.value?.description ?? "");
                  changeAddress(newValue, actionMeta, setFieldValue);
                }}
                value={values.address}
                label="Address"
              />
            </Grid>

            <Grid item xs={12} sm={5}>
              <FormInput
                key="suburb"
                id="suburb"
                name="suburb"
                placeholder="Suburb"
                label="Suburb"
                type="text"
                value={values.suburb}
                onChange={(e) => setFieldValue("suburb", e.target.value)}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <FormDropdown
                key="state"
                id="state"
                name="state"
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

            <Grid item xs={6} sm={3}>
              <FormInput
                key="postCode"
                id="postCode"
                name="postCode"
                placeholder="Post Code"
                label="Post Code"
                type="text"
                value={values.postCode}
                onChange={(e) => setFieldValue("postCode", e.target.value)}
              />
            </Grid>
          </Grid>
        );

        return (
          <Form onSubmit={handleSubmit}>
            <Container maxWidth={activeStep === 1 ? "xl" : "lg"} sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, sm: 3, md: 4 },
                  mt: { xs: 1, sm: 2, md: 3 },
                }}
              >
                {/* Stepper */}
                <Stepper
                  activeStep={activeStep}
                  alternativeLabel
                  sx={{ mb: { xs: 3, md: 4 } }}
                >
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Step 1: Order Information */}
                {activeStep === 0 && (
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        mb: { xs: 2, md: 3 },
                        fontSize: { xs: "1.1rem", sm: "1.5rem" },
                      }}
                    >
                      Order Information
                    </Typography>

                    <Grid container spacing={{ xs: 2, md: 3 }}>
                      <Grid item xs={12} sm={6}>
                        <FormInput
                          key="invoice_number"
                          id="invoice_number"
                          name="invoice_number"
                          placeholder="Invoice Number"
                          label="Invoice Number"
                          type="text"
                          optional={false}
                          disabled={true}
                          error={
                            touched.invoice_number || step1Errors.invoice_number
                              ? errors.invoice_number || step1Errors.invoice_number
                              : ""
                          }
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormInput
                          key="invoice_date"
                          id="invoice_date"
                          name="invoice_date"
                          placeholder="Invoice Date"
                          label="Invoice Date"
                          type="date"
                          optional={false}
                          error={
                            touched.invoice_date || step1Errors.invoice_date
                              ? errors.invoice_date || step1Errors.invoice_date
                              : ""
                          }
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormInput
                          key="due_date"
                          id="due_date"
                          name="due_date"
                          placeholder="Due Date"
                          label="Due Date"
                          type="date"
                          optional={false}
                          error={
                            touched.due_date || step1Errors.due_date
                              ? errors.due_date || step1Errors.due_date
                              : ""
                          }
                        />
                      </Grid>

                      {/* Quotation loaded banner */}
                      {selectedQuotation && (
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              p: { xs: 1.5, sm: 2 },
                              border: "1px solid",
                              borderColor: "primary.main",
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              variant="h6"
                              gutterBottom
                              color="primary"
                              sx={{ fontSize: { xs: "0.95rem", sm: "1.25rem" } }}
                            >
                              Creating Invoice from Quotation
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                flexWrap: "wrap",
                                gap: { xs: 0.5, sm: 2 },
                              }}
                            >
                              <Typography variant="body2">
                                <strong>Quotation:</strong> #{selectedQuotation.quotation_number}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Customer:</strong>{" "}
                                {selectedQuotation.customers?.name}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Total:</strong> ${selectedQuotation.total?.toFixed(2)}
                              </Typography>
                              {selectedQuotation.discount > 0 && (
                                <Typography variant="body2">
                                  <strong>Discount:</strong>{" "}
                                  {selectedQuotation.discount_type === "fixed"
                                    ? `$${selectedQuotation.discount.toFixed(2)}`
                                    : `${selectedQuotation.discount}%`}
                                </Typography>
                              )}
                              <Typography variant="body2">
                                <strong>Items:</strong> {selectedItems.length}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}

                      {/* Load from Quotation */}
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
                                    setDiscount(0);
                                    setDiscountType("percentage");
                                    setShowDiscountInput(false);
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
                            value={customers.find((c) => c.id === selectedCustomer) || null}
                            secondaryLabel={
                              !selectedQuotation ? (
                                <Box
                                  sx={{
                                    color: theme.palette.primary.main,
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                  }}
                                  onClick={() => setCreateInlineCustomer(true)}
                                >
                                  Create New Customer
                                </Box>
                              ) : null
                            }
                            loading={loadingCustomers}
                            optional={false}
                            onChange={handleSearchDebounced}
                            onSelect={(e) => setSelectedCustomer(e.target.value)}
                            error={errors.contactName || step1Errors.contactName}
                          />
                        </Grid>
                      ) : (
                        <Grid item xs={12}>
                          <FormInput
                            key="inlineCustomerName"
                            id="inlineCustomerName"
                            name="inlineCustomerName"
                            placeholder="Customer Name"
                            label="Customer Name"
                            type="text"
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
                              touched.inlineCustomerName || step1Errors.inlineCustomerName
                                ? errors.inlineCustomerName || step1Errors.inlineCustomerName
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
                      <Grid item xs={12} sm={6}>
                        <FormInput
                          key="emailAddress"
                          id="emailAddress"
                          name="emailAddress"
                          placeholder="Email Address"
                          label="Email Address"
                          type="email"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormInput
                          key="phone"
                          id="phone"
                          name="phone"
                          placeholder="Phone"
                          label="Phone"
                          type="text"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormInput
                          key="mobile"
                          id="mobile"
                          name="mobile"
                          placeholder="Mobile"
                          label="Mobile"
                          type="text"
                        />
                      </Grid>

                      {/* Address Section */}
                      <Grid item xs={12}>
                        {!createInlineCustomer && selectedCustomer && customerAddresses.length > 0 ? (
                          <Grid container spacing={{ xs: 1, sm: 2 }}>
                            <Grid item xs={12}>
                              {!customAddress ? (
                                <FormDropdown
                                  key="address-select"
                                  id="address-select"
                                  name="address-select"
                                  label="Select Delivery Address"
                                  useFormattedStrings={false}
                                  options={customerAddresses.map((addr, index) => ({
                                    label: `${addr.address}, ${addr.suburb} ${addr.state} ${addr.post_code}${addr.is_primary ? " (Primary)" : ""}`,
                                    value: index.toString(),
                                  }))}
                                  value={selectedAddressIndex.toString()}
                                  onChange={(e) => {
                                    handleAddressSelect(parseInt(e.target.value));
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
                                    New Delivery Address (this invoice only)
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
                            <Grid item xs={12}>
                              <AddressFields />
                            </Grid>
                          </Grid>
                        ) : (
                          <Box>
                            {!createInlineCustomer &&
                              selectedCustomer &&
                              customerAddresses.length === 0 && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                  No addresses found for this customer. Please enter address manually below.
                                </Alert>
                              )}
                            <AddressFields />
                          </Box>
                        )}
                      </Grid>

                      {/* Notes */}
                      <Grid item xs={12}>
                        <FormInput
                          key="note"
                          id="note"
                          name="note"
                          placeholder="Notes"
                          label="Notes"
                          type="text"
                          isTextArea
                        />
                      </Grid>
                    </Grid>

                    {/* Next Button */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "stretch", sm: "flex-end" },
                        mt: 3,
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={() => handleNext(validateForm)}
                        size="large"
                        fullWidth
                        sx={{ maxWidth: { sm: 240 } }}
                      >
                        Next: Select Items
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Step 2: Select Items */}
                {activeStep === 1 && (
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        mb: { xs: 2, md: 3 },
                        fontSize: { xs: "1.1rem", sm: "1.5rem" },
                      }}
                    >
                      Select Items
                    </Typography>

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
                      deposit={deposit}
                      setDeposit={setDeposit}
                    />

                    {/* Navigation Buttons */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column-reverse", sm: "row" },
                        justifyContent: "space-between",
                        gap: { xs: 1, sm: 0 },
                        mt: 4,
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={handleBack}
                        size="large"
                        fullWidth
                        sx={{ maxWidth: { sm: 160 } }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handleSubmitStep2(handleSubmit)}
                        disabled={isSubmitting}
                        size="large"
                        fullWidth
                        sx={{ maxWidth: { sm: 240 } }}
                      >
                        {isSubmitting ? "Creating Invoice..." : "Create Invoice"}
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
