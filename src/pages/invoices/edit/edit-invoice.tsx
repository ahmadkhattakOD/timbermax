// project-imports
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { InvoiceItem, useEditInvoice } from "./use-edit-invoice";
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

import AddressFields from "components/AddressFields";
import InputDropdown from "components/InputDropdown";
import ItemsSelectionTable from "components/ItemsSelectionTable";
import CreateItemModal from "components/CreateItemModal";
import CustomerFormSync from "components/CustomerFormSync";
import { useParams, useNavigate } from "react-router-dom";
import ActionButton from "components/ActionButton";
import { useEffect, useMemo, useCallback, useState } from "react";
import { openSnackbar } from "api/snackbar";
import { SnackbarProps } from "types/snackbar";

// ==============================|| EDIT INVOICE PAGE ||============================== //

export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
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
    items,
    customers,
    loading,
    selectedItems,
    addItem,
    addCreatedItemToInvoice,
    removeItem,
    reorderItems,
    updateItem,
    totalAmount,
    loadingItems,
    loadingCustomers,
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
    handleSearchDebounced,
    initialValues,
    currentStatus,
    invoiceData,
    selectedCustomer,
    selectCustomer,
    selectedCustomerRecord,
    createInlineCustomer,
    setCreateInlineCustomer,
    inlineCustomerName,
    setInlineCustomerName,
    customerName,
    setCustomerName,
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    isCustomAddress,
    handleAddressSelect,
    customerId,
    // Payment method properties
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    customPaymentMethod,
    setCustomPaymentMethod,
    // Discount properties
    discount,
    setDiscount,
    discountType,
    setDiscountType,
    showDiscountInput,
    setShowDiscountInput,
    discountAmount,
    finalAmount,
    // Deposit
    deposit,
    setDeposit,
  } = useEditInvoice(id ? parseInt(id) : 0);

  const leaveCustomAddressMode = useCallback(() => setCustomAddress(false), []);

  const warn = (message: string) =>
    openSnackbar({
      open: true,
      message,
      variant: "alert",
      alert: { color: "warning" },
    } as SnackbarProps);

  // When the loaded invoice uses a one-time address not saved on the customer,
  // open the custom-address UI so the snapshot fields show instead of the dropdown.
  useEffect(() => {
    if (isCustomAddress) setCustomAddress(true);
  }, [isCustomAddress]);

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

  if (!invoiceData && !loading) {
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
        <Typography variant="h6">Invoice not found</Typography>
        <ActionButton
          text="Back to Invoices"
          onClick={() => navigate(-1)}
        />
      </Box>
    );
  }

  const steps = ['Invoice Details', 'Select Items'];

  const handleBack = () => {
    setActiveStep(0);
  };

  return (
    <Formik
      // initialValues are set once, before the form is mounted; nothing patches
      // them afterwards, so reinitialising can only throw away edits.
      enableReinitialize={false}
      validateOnMount={false}
      // Errors have to refresh as the form is filled in, otherwise a message
      // raised earlier (e.g. "Customer Name required") stays on screen after the
      // field is populated.
      validateOnChange={true}
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
              'invoice_number',
              'status',
              'contactName',
              'inlineCustomerName',
              'payment_method',
              'invoice_date',
            ];

            // Special validation for payment method when status is paid
            const needsPaymentMethod = values.status === 'paid';
            const hasPaymentMethodError = needsPaymentMethod && (!values.payment_method || (selectedPaymentMethod === 'other' && !customPaymentMethod));

            const step1HasErrors = step1Fields.some(field => validationErrors[field]) || hasPaymentMethodError;
            setShowStep1Errors(step1HasErrors);

            if (!step1HasErrors) {
              setActiveStep(1);
            }
          });
        };

        const handleSubmitStep2 = () => {
          // Validate that at least one item is selected
          if (selectedItems.length === 0) {
            warn('Please add at least one item before updating.');
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

        // Error text for a step 1 field: only after the field was touched or
        // "Next" was pressed, and only while it is actually still invalid.
        const fieldError = (field: string): string =>
          showStep1Errors || (touched as any)[field]
            ? ((errors as any)[field] ?? "")
            : "";

        // Memoized callback for payment method dropdown change
        const handlePaymentMethodChange = useCallback(
          (e: any) => {
            const value = e.target.value;
            setSelectedPaymentMethod(value);

            if (value === "other") {
              // Don't set payment_method yet, wait for custom input
              setFieldValue("payment_method", "");
              setCustomPaymentMethod("");
            } else {
              setFieldValue("payment_method", value);
              setCustomPaymentMethod("");
            }
          },
          [setFieldValue, setSelectedPaymentMethod, setCustomPaymentMethod]
        );

        // Memoized callback for custom payment method input change
        const handleCustomPaymentMethodChange = useCallback(
          (e: any) => {
            setCustomPaymentMethod(e.target.value);
            setFieldValue("payment_method", e.target.value);
          },
          [setFieldValue, setCustomPaymentMethod]
        );

        // Memoized payment method section
        const paymentMethodSection = useMemo(() => {
          if (values.status !== "paid") return null;

          return (
            <Box key="payment-method-section">
              <FormDropdown
                key="payment_method"
                id={"payment_method"}
                name={"payment_method"}
                label="Payment Method"
                useFormattedStrings={false}
                options={[
                  { label: "Cash", value: "cash" },
                  { label: "Credit Card", value: "credit_card" },
                  { label: "Bank Transfer", value: "bank_transfer" },
                  { label: "Other", value: "other" },
                ]}
                optional={false}
                error={touched.payment_method ? errors.payment_method : ""}
                onChange={handlePaymentMethodChange}
                value={selectedPaymentMethod}
              />

              {selectedPaymentMethod === "other" && (
                <FormInput
                  key="custom_payment_method"
                  id={"custom_payment_method"}
                  name={"custom_payment_method"}
                  placeholder={"Enter payment method"}
                  label="Custom Payment Method"
                  type={"text"}
                  optional={false}
                  value={customPaymentMethod}
                  onChange={handleCustomPaymentMethodChange}
                  error={
                    selectedPaymentMethod === "other" && !customPaymentMethod
                      ? "required"
                      : ""
                  }
                />
              )}
            </Box>
          );
        }, [
          values.status,
          selectedPaymentMethod,
          customPaymentMethod,
          touched.payment_method,
          errors.payment_method,
          handlePaymentMethodChange,
          handleCustomPaymentMethodChange,
        ]);

        const isReadOnly = invoiceData?.status === "paid";

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

                {isReadOnly && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    This invoice has been paid and is view-only. Editing is
                    disabled.
                  </Alert>
                )}

                {/* Step 1: Invoice Details */}
                {activeStep === 0 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                      Invoice Details
                    </Typography>

                    <Box
                      component="fieldset"
                      disabled={isReadOnly}
                      sx={{ border: "none", p: 0, m: 0, minInlineSize: "auto" }}
                    >
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="invoice_number"
                          id={"invoice_number"}
                          name={"invoice_number"}
                          placeholder={"Invoice Number"}
                          label="Invoice Number"
                          type={"text"}
                          optional={false}
                          error={fieldError("invoice_number")}
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
                            { label: "Overdue", value: "overdue" },
                            { label: "Paid", value: "paid" },
                            { label: "Cancelled", value: "cancelled" },
                          ]}
                          optional={false}
                          error={fieldError("status")}
                          onChange={(e) => {
                            setFieldValue("status", e.target.value);
                            // Clear payment method when status changes from paid
                            if (e.target.value !== "paid") {
                              setFieldValue("payment_method", "");
                              setSelectedPaymentMethod("");
                              setCustomPaymentMethod("");
                            }
                          }}
                        />
                      </Grid>

                      {/* Payment method field - only shown when status is "paid" */}
                      {values.status === "paid" && (
                        <>
                          <Grid item xs={12} md={6}>
                            <FormDropdown
                              key="payment_method"
                              id={"payment_method"}
                              name={"payment_method"}
                              label="Payment Method"
                              useFormattedStrings={false}
                              options={[
                                { label: "Cash", value: "cash" },
                                { label: "Credit Card", value: "credit_card" },
                                { label: "Bank Transfer", value: "bank_transfer" },
                                { label: "Other", value: "other" },
                              ]}
                              optional={false}
                              error={fieldError("payment_method")}
                              onChange={handlePaymentMethodChange}
                              value={selectedPaymentMethod}
                            />
                          </Grid>

                          {selectedPaymentMethod === "other" && (
                            <Grid item xs={12} md={6}>
                              <FormInput
                                key="custom_payment_method"
                                id={"custom_payment_method"}
                                name={"custom_payment_method"}
                                placeholder={"Enter payment method"}
                                label="Custom Payment Method"
                                type={"text"}
                                optional={false}
                                value={customPaymentMethod}
                                onChange={handleCustomPaymentMethodChange}
                                error={
                                  selectedPaymentMethod === "other" && !customPaymentMethod
                                    ? "required"
                                    : ""
                                }
                              />
                            </Grid>
                          )}
                        </>
                      )}

                      {/* CUSTOMER MODULE */}
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
                            error={fieldError("inlineCustomerName")}
                            onChange={(e) => {
                              setFieldValue("inlineCustomerName", e.target.value);
                              setInlineCustomerName(e.target.value);
                            }}
                            value={values.inlineCustomerName}
                          />
                        </Grid>
                      )}

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

                      {/* CONTACT DETAILS */}
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

                      <Grid item xs={12} md={6}>
                        <FormDropdown
                          key="delivery_status"
                          id={"delivery_status"}
                          name={"delivery_status"}
                          label="Delivery Status"
                          options={[
                            { label: "Pending", value: "pending" },
                            { label: "Packed", value: "packed" },
                            { label: "Shipped", value: "shipped" },
                            { label: "Delivered", value: "delivered" },
                            { label: "Pick Up", value: "pick_up" },
                            { label: "Returned", value: "returned" },
                          ]}
                          optional={false}
                          error={fieldError("delivery_status")}
                        />
                      </Grid>

                      {/* INVOICE DATE */}
                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="invoice_date"
                          id={"invoice_date"}
                          name={"invoice_date"}
                          placeholder={"Invoice Date"}
                          label="Invoice Date"
                          type={"date"}
                          optional={false}
                          error={fieldError("invoice_date")}
                          value={values.invoice_date}
                          onChange={(e) => {
                            setFieldValue("invoice_date", e.target.value);
                          }}
                        />
                      </Grid>

                      {/* DUE DATE */}
                      <Grid item xs={12} md={6}>
                        <FormInput
                          key="due_date"
                          id={"due_date"}
                          name={"due_date"}
                          placeholder={"Due Date"}
                          label="Due Date"
                          type={"date"}
                          optional={true}
                          value={values.due_date}
                          onChange={(e) => {
                            setFieldValue("due_date", e.target.value);
                          }}
                        />
                      </Grid>

                      {/* ADDRESS SECTION */}
                      <Grid item xs={12}>
                        {customerId && customerAddresses.length > 0 ? (
                          // For existing customers with addresses - Show address selection
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

                      <AddressFields
                        variant="document"
                        values={values}
                        setFieldValue={setFieldValue}
                        changeAddress={changeAddress}
                      />
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
                    </Box>

                    {/* Navigation Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(-1)}
                        size="large"
                      >
                        {isReadOnly ? "Back to Invoices" : "Cancel"}
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        size="large"
                      >
                        {isReadOnly ? "View Items" : "Next: Select Items"}
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

                    <Box
                      component="fieldset"
                      disabled={isReadOnly}
                      sx={{ border: "none", p: 0, m: 0, minInlineSize: "auto" }}
                    >
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
                      deposit={deposit}
                      setDeposit={setDeposit}
                      onCreateNewItemClick={
                        isReadOnly ? undefined : () => setCreateItemModalOpen(true)
                      }
                      showItemNotes
                    />
                    </Box>

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
                          onClick={() => navigate(-1)}
                          size="large"
                        >
                          {isReadOnly ? "Back to Invoices" : "Cancel"}
                        </Button>
                      </Box>
                      {!isReadOnly && (
                        <Button
                          variant="contained"
                          onClick={handleSubmitStep2}
                          disabled={isSubmitting}
                          size="large"
                        >
                          {isSubmitting ? 'Updating Invoice...' : 'Update Invoice'}
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Container>

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
