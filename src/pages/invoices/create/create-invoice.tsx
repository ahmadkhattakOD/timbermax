// project-imports
import FormLayout from "components/FormLayout";
import { ErrorMessage, Field, Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateInvoice } from "./useCreateInvoice";
import { australianStates, getDateFormattedForField } from "utils/helpers";
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
    setSelectedCustomer,
    changeAddress,
    setSelectedSuburb,
    setSelectedState,
    setSelectedEmail,
    setSelectedPhone,
    setSelectedMobile,
    setSelectedPostCode,
    selectedCustomer,
    loadFromQuotation,
    selectedQuotation,
    isQuotationLoaded,
    setSelectedItems,
    setIsQuotationLoaded,
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
      enableReinitialize
      initialValues={{
        invoice_number: `INV-${Date.now()}`,
        contactName: "",
        inlineCustomerName: "",
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
      }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"Create Invoice"}
            inputs={[
              <FormInput
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
                      {selectedQuotation.customer?.name}
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
                    id={"quotation_id"}
                    name={"quotation_id"}
                    label={"Load from Quotation (Optional)"}
                    options={[
                      { label: "Create New Invoice", value: "" },
                      ...quotations.map((q) => ({
                        label: `Quotation #${q.quotation_number} - ${q.customer?.name || "Unknown"} - $${q.total}`,
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
                        setFieldValue("total", 0);
                        setIsQuotationLoaded(false);
                      }
                    }}
                  />
                </Box>
              ),

              // CUSTOMER MODULE - EXACTLY LIKE SALES
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
                  value={selectedCustomer || ""}
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

              // CONTACT DETAILS - EXACTLY LIKE SALES
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

              // INVOICE DATE
              <FormInput
                id={"invoice_date"}
                name={"invoice_date"}
                placeholder={"Invoice Date"}
                label={"Invoice Date"}
                type={"date"}
                optional={false}
                // InputLabelProps={{ shrink: true }}
                error={touched.invoice_date ? errors.invoice_date : ""}
              />,

              // ITEMS TABLE
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Items
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <FormDropdown
                    id={"add_item"}
                    name={"add_item"}
                    label={"Add Item"}
                    options={items.map((item) => ({
                      label: `${item.name} (${item.itemCode}) - $${item.sellPrice}`,
                      value: item.id.toString(),
                    }))}
                    onChange={(e) => {
                      const itemId = parseInt(e.target.value);
                      if (itemId) {
                        const item = items.find((i) => i.id === itemId);
                        if (item) {
                          addItem({
                            item_id: item.id,
                            name: item.name,
                            itemCode: item.itemCode,
                            quantity: 1,
                            unit_price: item.sellPrice,
                            total: item.sellPrice,
                          });
                        }
                      }
                    }}
                  />
                </Box>

                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
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
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  parseFloat(e.target.value) || 1
                                )
                              }
                              style={{
                                width: "80px",
                                padding: "8px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                              }}
                              min={1}
                            />
                          </TableCell>
                          <TableCell>
                            <input
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
                          <TableCell>
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={() => removeItem(index)}>
                              <Trash size={20} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right">
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
                id={"note"}
                name={"note"}
                placeholder={"Notes"}
                label={"Notes"}
                type={"text"}
                isTextArea
                // rows={3}
              />,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
