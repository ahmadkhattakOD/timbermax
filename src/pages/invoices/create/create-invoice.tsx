import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateInvoice } from "./useCreateInvoice";
import {
  australianStates,
  calculateItemTotal,
  getDateFormattedForField,
} from "utils/helpers";
import CircularLoader from "components/CircularLoader";
import {
  Box,
  IconButton,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import { Add, Trash } from "iconsax-react";
import PlacesInput from "components/PlacesInput";
import InputDropdown from "components/InputDropdown";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// ==============================|| CREATE INVOICE PAGE ||============================== //

export default function CreateInvoice() {
  const [searchParams] = useSearchParams();
  const quotationIdFromUrl = searchParams.get("quotation_id");

  const {
    validate,
    onSubmit,
    customers,
    items,
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

  return (
    <Formik
      enableReinitialize={false}
      validateOnMount={false}
      validateOnChange={false}
      validateOnBlur={true}
      initialValues={{
        invoice_number: `INV-${Date.now()}`,
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

        return (
          <Form onSubmit={handleSubmit}>
            <FormLayout
              isSubmitting={isSubmitting}
              submitButtonText={"Create Invoice"}
              inputs={[
                <FormInput
                  key="invoice_number"
                  id={"invoice_number"}
                  name={"invoice_number"}
                  placeholder={"Invoice Number"}
                  label={"Invoice Number"}
                  type={"text"}
                  optional={false}
                  error={touched.invoice_number ? errors.invoice_number : ""}
                />,

                // Show quotation info if loaded from quotation
                selectedQuotation && (
                  <Box
                    key="quotation-info"
                    sx={{
                      mb: 3,
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
                ),

                // OPTION TO LOAD FROM QUOTATION (only show if not already loaded from URL)
                !quotationIdFromUrl && (
                  <Box key="load-quotation" sx={{ mb: 2 }}>
                    <FormDropdown
                      key="quotation_id"
                      id={"quotation_id"}
                      name={"quotation_id"}
                      label={"Load from Quotation (Optional)"}
                      options={[
                        { label: "Create New Invoice", value: "" },
                        ...quotations.map((q) => ({
                          label: `Quotation #${q.quotation_number} - ${q.customer?.name || "Unknown"} - $${q.total?.toFixed(2)}`,
                          value: q.id.toString(),
                        })),
                      ]}
                      onChange={(e) => {
                        const quotationId = parseInt(e.target.value);
                        if (quotationId) {
                          loadFromQuotation(quotationId);
                        } else {
                          // Clear if "Create New Invoice" is selected
                          setSelectedItems([]);
                          setIsQuotationLoaded(false);
                          setSelectedCustomer(undefined);
                          setCustomerName("");
                          setFieldValue("contactName", "");
                        }
                      }}
                    />
                  </Box>
                ),

                !createInlineCustomer ? (
                  <InputDropdown
                    key="contactName"
                    id="contactName"
                    name="contactName"
                    label="Customer Name"
                    options={customers}
                    value={
                      // Find the full customer object based on selectedCustomer ID
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
                    error={errors.contactName}
                  />
                ) : null,

                createInlineCustomer ? (
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
                      touched.inlineCustomerName
                        ? errors.inlineCustomerName
                        : ""
                    }
                    onChange={(e) => {
                      setFieldValue("inlineCustomerName", e.target.value);
                      setInlineCustomerName(e.target.value);
                    }}
                    value={values.inlineCustomerName}
                  />
                ) : null,

                // CONTACT DETAILS
                <FormInput
                  key="phone"
                  id={"phone"}
                  name={"phone"}
                  placeholder={"Phone"}
                  label="Phone"
                  type={"text"}
                />,

                <FormInput
                  key="mobile"
                  id={"mobile"}
                  name={"mobile"}
                  placeholder={"Mobile"}
                  label="Mobile"
                  type={"text"}
                />,

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
                  value={selectedAddress}
                  label="Address"
                />,

                <FormInput
                  key="suburb"
                  id={"suburb"}
                  name={"suburb"}
                  placeholder={"Suburb"}
                  label="Suburb"
                  type={"text"}
                />,

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
                />,

                <FormInput
                  key="postCode"
                  id={"postCode"}
                  name={"postCode"}
                  placeholder={"Post Code"}
                  label="Post Code"
                  type={"text"}
                />,

                <FormInput
                  key="emailAddress"
                  id={"emailAddress"}
                  name={"emailAddress"}
                  placeholder={"Email Address"}
                  label="Email Address"
                  type={"email"}
                />,

                // INVOICE DATE
                <FormInput
                  key="invoice_date"
                  id={"invoice_date"}
                  name={"invoice_date"}
                  placeholder={"Invoice Date"}
                  label={"Invoice Date"}
                  type={"date"}
                  optional={false}
                  error={touched.invoice_date ? errors.invoice_date : ""}
                />,

                // ITEMS TABLE WITH GST
                <Box key="items-section" sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <InputDropdown
                      key="item_search"
                      id="item_search"
                      name="item_search"
                      label="Select Item"
                      options={items}
                      loading={loadingItems}
                      optional={false}
                      onChange={handleItemSearchDebounced}
                      onSelect={(e) => {
                        const itemId = parseInt(e.target.value);
                        if (itemId) {
                          setSelectedItemId(itemId);
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<Add size={20} />}
                      onClick={() => {
                        if (selectedItemId) {
                          addItem(selectedItemId);
                          setSelectedItemId(null);
                        }
                      }}
                      sx={{ mt: 4 }}
                      disabled={!selectedItemId}
                    >
                      Add
                    </Button>
                  </Box>
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Code</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>GST</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.itemCode}</TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <input
                                  id={`items[${index}].quantity`}
                                  name={`items[${index}].quantity`}
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    updateItem(
                                      index,
                                      "quantity",
                                      parseFloat(e.target.value)
                                    );
                                  }}
                                  style={{
                                    width: "80px",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                  }}
                                  min={1}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <input
                                id={`items[${index}].unit_price`}
                                name={`items[${index}].unit_price`}
                                type="number"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "unit_price",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                style={{
                                  width: "100px",
                                  padding: "8px",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                }}
                                min={0}
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell>{item.gst ? "Yes" : "No"}</TableCell>
                            <TableCell>
                              ${calculateItemTotal(item).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <IconButton onClick={() => removeItem(index)}>
                                <Trash size={20} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={5} align="right">
                            <strong>Total:</strong>
                          </TableCell>
                          <TableCell>
                            <strong>${totalAmount.toFixed(2)}</strong>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>,

                // NOTES
                <FormInput
                  key="note"
                  id={"note"}
                  name={"note"}
                  placeholder={"Notes"}
                  label={"Notes"}
                  type={"text"}
                  isTextArea
                />,
              ]}
            />
          </Form>
        );
      }}
    </Formik>
  );
}
