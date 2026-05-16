// project-imports
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { InvoiceItem, useEditInvoice } from "./use-edit-invoice";
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
import InputDropdown from "components/InputDropdown";
import ItemsSelectionTable from "components/ItemsSelectionTable";
import NewAddressForm from "components/NewAddressForm";
import { useParams, useNavigate } from "react-router-dom";
import ActionButton from "components/ActionButton";
import { useEffect, useMemo, useCallback, useState } from "react";

// ==============================|| EDIT INVOICE PAGE ||============================== //

export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [step1Errors, setStep1Errors] = useState<any>({});

  const {
    validate,
    onSubmit,
    items,
    customers,
    loading,
    selectedItems,
    addItem,
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
    setSelectedCustomer,
    createInlineCustomer,
    setCreateInlineCustomer,
    inlineCustomerName,
    setInlineCustomerName,
    customerName,
    setCustomerName,
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    handleAddressSelect,
    customerId,
    addingNewAddress,
    setAddingNewAddress,
    newAddressForm,
    setNewAddressForm,
    saveNewAddress,
    savingNewAddress,
    changeNewAddress,
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
          onClick={() => navigate("/invoices")}
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
      enableReinitialize={true}
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

        // Auto-populate customer details when selected
        useEffect(() => {
          if (selectedCustomer && customers.length > 0) {
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

                {/* Step 1: Invoice Details */}
                {activeStep === 0 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                      Invoice Details
                    </Typography>

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
                          error={touched.invoice_number || step1Errors.invoice_number ? errors.invoice_number || step1Errors.invoice_number : ""}
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
                          error={touched.status || step1Errors.status ? errors.status || step1Errors.status : ""}
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
                              error={touched.payment_method || step1Errors.payment_method ? errors.payment_method || step1Errors.payment_method : ""}
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
                            value={customers.find((c) => c.id === selectedCustomer) || null}
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
                          error={touched.delivery_status || step1Errors.delivery_status ? errors.delivery_status || step1Errors.delivery_status : ""}
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
                          error={touched.invoice_date || step1Errors.invoice_date ? errors.invoice_date || step1Errors.invoice_date : ""}
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
                        {!addingNewAddress && (
                          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
                            <Typography
                              sx={{ color: theme.palette.primary.main, cursor: "pointer", fontSize: "14px", fontWeight: 600 }}
                              onClick={() => setAddingNewAddress(true)}
                            >
                              + Add New Address
                            </Typography>
                          </Box>
                        )}
                        {addingNewAddress && (
                          <NewAddressForm
                            form={newAddressForm}
                            onChange={setNewAddressForm}
                            onAddressChange={changeNewAddress}
                            onSave={saveNewAddress}
                            saving={savingNewAddress}
                            onCancel={() => {
                              setAddingNewAddress(false);
                              setNewAddressForm({ address: "", suburb: "", state: "", post_code: "", is_primary: false });
                            }}
                          />
                        )}
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
                          // For customers without addresses or manual entry
                          <Box>
                      {customerId && customerAddresses.length === 0 ? (
                        <Box>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            No addresses found for this customer. Please enter address manually or save a new one.
                          </Alert>
                          {!addingNewAddress && (
                            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
                              <Typography
                                sx={{ color: theme.palette.primary.main, cursor: "pointer", fontSize: "14px", fontWeight: 600 }}
                                onClick={() => setAddingNewAddress(true)}
                              >
                                + Add New Address
                              </Typography>
                            </Box>
                          )}
                          {addingNewAddress && (
                            <NewAddressForm
                              form={newAddressForm}
                              onChange={setNewAddressForm}
                              onAddressChange={changeNewAddress}
                              onSave={saveNewAddress}
                              saving={savingNewAddress}
                              onCancel={() => {
                                setAddingNewAddress(false);
                                setNewAddressForm({ address: "", suburb: "", state: "", post_code: "", is_primary: false });
                              }}
                            />
                          )}
                        </Box>
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
                        onClick={() => navigate("/invoices")}
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
                          onClick={() => navigate("/invoices")}
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
                        {isSubmitting ? 'Updating Invoice...' : 'Update Invoice'}
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
