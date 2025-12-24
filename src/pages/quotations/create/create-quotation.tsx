import FormLayout from "components/FormLayout";
import { ErrorMessage, Field, Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateQuotation } from "./use-create-quotation";
import { australianStates, calculateItemTotal, getDateFormattedForField } from "utils/helpers";
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
import { useEffect, useState } from "react";
import { Button } from "@mui/material";

// ==============================|| CREATE QUOTATION PAGE ||============================== //

export default function CreateQuotation() {
  const {
    validate,
    onSubmit,
    customers,
    items,
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

  return (
    <Formik
      enableReinitialize={false}
      validateOnMount={false}
      validateOnChange={false}
      validateOnBlur={true}
      initialValues={{
        quotation_number: String(quotationNumberRef.current),
        contactName: "",
        inlineCustomerName: inlineCustomerName,
        phone: selectedPhone,
        mobile: selectedMobile,
        address: selectedAddress,
        suburb: selectedSuburb,
        state: selectedState,
        postCode: selectedPostCode,
        emailAddress: selectedEmail,
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
      }) => {
        useEffect(() => {
          if (selectedCustomer) {
            const customer = customers.find((c) => c.id === selectedCustomer);
            if (customer) {
              // Update Formik values
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
            setFieldValue("phone", "");
            setFieldValue("mobile", "");
            setFieldValue("address", "");
            setFieldValue("suburb", "");
            setFieldValue("state", "");
            setFieldValue("postCode", "");
            setFieldValue("emailAddress", "");
          }
        }, [selectedCustomer, customers, createInlineCustomer, setFieldValue]);
        return (
          <Form onSubmit={handleSubmit}>
            <FormLayout
              isSubmitting={isSubmitting}
              submitButtonText="Create a Quote"
              inputs={[
                <FormInput
                  key="quotation_number"
                  id={"quotation_number"}
                  name={"quotation_number"}
                  placeholder={"Quotation Number"}
                  label="Quote Number"
                  type={"text"}
                  optional={false}
                  error={
                    touched.quotation_number ? errors.quotation_number : ""
                  }
                />,

                // CUSTOMER MODULE
                !createInlineCustomer ? (
                  <InputDropdown
                    key="contactName"
                    id="contactName"
                    name="contactName"
                    label="Contact Name"
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
                  />
                ) : null,

                createInlineCustomer ? (
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
                        }}
                      >
                        Cancel Manual
                      </Box>
                    }
                    error={
                      touched.inlineCustomerName
                        ? errors.inlineCustomerName
                        : ""
                    }
                    onChange={(e) => {
                      setFieldValue("inlineCustomerName", e.target.value);
                      setInlineCustomerName(e.target.value); // Update the state in hook
                    }}
                    value={values.inlineCustomerName}
                  />
                ) : null,

                // CONTACT DETAILS - Let Formik manage these fields
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
                <FormInput
                  key="note"
                  id={"note"}
                  name={"note"}
                  placeholder={"Notes"}
                  label="Notes"
                  type={"text"}
                  isTextArea
                />,
                // ITEMS TABLE
                <Box key="items-section">
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
                        {selectedItems.map((item, index) => {
                          return (
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
                          );
                        })}
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
              ]}
            />
          </Form>
        );
      }}
    </Formik>
  );
}
