import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateInvoice } from "./useCreateInvoice";
import { formatAmount, getDateFormattedForField } from "utils/helpers";
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
  Backdrop,
} from "@mui/material";
import AddressFields from "components/AddressFields";
import InputDropdown from "components/InputDropdown";
import ItemsSelectionTable from "components/ItemsSelectionTable";
import CreateItemModal from "components/CreateItemModal";
import CustomerFormSync from "components/CustomerFormSync";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { openSnackbar } from "api/snackbar";
import { SnackbarProps } from "types/snackbar";

// ==============================|| CREATE INVOICE PAGE ||============================== //

export default function CreateInvoice() {
  const [searchParams] = useSearchParams();
  const quotationIdFromUrl = searchParams.get("quotation_id");
  const [activeStep, setActiveStep] = useState(0);
  // Step 1 errors are shown once "Next" has been pressed. The messages themselves
  // always come from Formik's live `errors`, so they disappear as soon as the
  // field is filled in instead of sticking around from an older validation run.
  const [showStep1Errors, setShowStep1Errors] = useState(false);
  // One-time delivery address typed on the invoice (not saved to the customer)
  const [customAddress, setCustomAddress] = useState(false);
  // Inline "Create New Item" modal (step 2)
  const [createItemModalOpen, setCreateItemModalOpen] = useState(false);

  const {
    validate,
    onSubmit,
    customers,
    items,
    warehouses,
    quotations,
    loading,
    actionLoading,
    selectedItems,
    addItem,
    addCreatedItemToInvoice,
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
    clearQuotation,
    selectedQuotation,
    isQuotationLoaded,
    handleItemSearchDebounced,
    loadingItems,
    selectedItemId,
    setSelectedItemId,
    inlineCustomerName,
    setInlineCustomerName,
    changeAddress,
    selectCustomer,
    selectedCustomerRecord,
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

  const leaveCustomAddressMode = useCallback(() => setCustomAddress(false), []);

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
    if (selectedItems.length === 0) {
      warn("Please add at least one item before submitting.");
      return;
    }
    const hasInvalidItems = selectedItems.some((item) => !item.warehouse_id);
    if (hasInvalidItems) {
      warn("Please select a warehouse for all items.");
      return;
    }
    handleSubmit();
  };

  return (
    <Formik
      enableReinitialize={false}
      validateOnMount={false}
      // Errors have to refresh as the form is filled in, otherwise a message
      // raised earlier (e.g. "Customer Name required") stays on screen after the
      // field is populated.
      validateOnChange={true}
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
        // Error text for a step 1 field: only after the field was touched or
        // "Next" was pressed, and only while it is actually still invalid.
        const fieldError = (field: string): string =>
          showStep1Errors || (touched as any)[field]
            ? ((errors as any)[field] ?? "")
            : "";

        // Shared address fields – used in both address-select and manual modes.
        // Kept as a JSX element (stable type) so PlacesInput is not remounted on
        // re-render (the Vercel "flicker" bug). Fields come from the shared
        // module-scope <AddressFields> component.
        const addressFields = (
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <AddressFields
              variant="invoice"
              values={values}
              setFieldValue={setFieldValue}
              changeAddress={changeAddress}
            />
          </Grid>
        );

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
              applyCustomerAddress
            />
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
                          error={fieldError("invoice_number")}
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
                          error={fieldError("invoice_date")}
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
                          error={fieldError("due_date")}
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
                                <strong>Total:</strong> ${formatAmount(selectedQuotation.total)}
                              </Typography>
                              {selectedQuotation.discount > 0 && (
                                <Typography variant="body2">
                                  <strong>Discount:</strong>{" "}
                                  {selectedQuotation.discount_type === "fixed"
                                    ? `$${formatAmount(selectedQuotation.discount)}`
                                    : `${formatAmount(selectedQuotation.discount)}%`}
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
                              name: `#${q.quotation_number} - ${q.customer?.name || "Unknown"} - $${formatAmount(q.total)}`,
                            }))}
                            value={
                              selectedQuotation
                                ? {
                                    id: selectedQuotation.id,
                                    name: `#${selectedQuotation.quotation_number} - ${selectedQuotation.customers?.name || "Unknown"} - $${formatAmount(selectedQuotation.total)}`,
                                  }
                                : null
                            }
                            loading={loadingQuotations}
                            optional={true}
                            onChange={handleQuotationSearchDebounced}
                            onSelect={(_e, option) => {
                              if (option?.id) {
                                loadFromQuotation(option.id);
                              } else {
                                clearQuotation();
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
                                    // Also drops the quotation itself — it used to
                                    // stay linked (and shown) after being cleared.
                                    clearQuotation();
                                    setFieldValue("quotation_id", "");
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
                            // Bound to the stored record, not to a lookup in the
                            // search results — those change while typing and the
                            // field would blank out mid-search.
                            value={selectedCustomerRecord || null}
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
                              {addressFields}
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
                            {addressFields}
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
                      onCreateNewItemClick={() => setCreateItemModalOpen(true)}
                      showItemNotes
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

            {/* Loading a quotation/customer keeps the form mounted — unmounting it
                would throw away everything already filled in. */}
            <Backdrop
              open={actionLoading}
              sx={{ zIndex: (t) => t.zIndex.drawer + 1, color: "#fff" }}
            >
              <CircularLoader />
            </Backdrop>

            {/* Inline item creation (step 2) — creates the item and adds it to the invoice */}
            <CreateItemModal
              open={createItemModalOpen}
              onClose={() => setCreateItemModalOpen(false)}
              onCreated={addCreatedItemToInvoice}
            />
          </Form>
        );
      }}
    </Formik>
  );
}
