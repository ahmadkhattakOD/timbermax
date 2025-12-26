// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditInvoice } from "./use-edit-invoice";
import { australianStates, calculateItemTotal, getDateFormattedForField } from "utils/helpers";
import CircularLoader from "components/CircularLoader";
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  useTheme,
} from "@mui/material";
import { Add, Trash } from "iconsax-react";
import PlacesInput from "components/PlacesInput";
import InputDropdown from "components/InputDropdown";
import { useParams, useNavigate } from "react-router-dom";
import ActionButton from "components/ActionButton";

// ==============================|| EDIT INVOICE PAGE ||============================== //

export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    validate,
    onSubmit,
    items,
    customers,
    loading,
    selectedItems,
    addItem,
    removeItem,
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

  // Check if invoice can be edited
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
          This invoice cannot be edited
        </Typography>
        <Typography variant="body1" textAlign="center">
          Only draft and sent invoices can be edited.
          <br />
          Current status:{" "}
          <strong>
            {currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1)}
          </strong>
          <br />
          Delivery status:{" "}
          <strong>
            {invoiceData?.delivery_status?.charAt(0).toUpperCase() + invoiceData?.delivery_status?.slice(1) || "Pending"}
          </strong>
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <ActionButton
            text="Back to Invoices"
            onClick={() => navigate("/invoices")}
          />
          <ActionButton
            text="View Details"
            onClick={() => navigate(`/invoices/view/${id}`)}
            color="info"
          />
        </Box>
      </Box>
    );
  }

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
      }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText="Update Invoice"
            cancelButtonText="Cancel"
            onCancel={() => navigate("/invoices")}
            inputs={[
              <FormInput
                key="invoice_number"
                id={"invoice_number"}
                name={"invoice_number"}
                placeholder={"Invoice Number"}
                label="Invoice Number"
                type={"text"}
                optional={false}
                error={touched.invoice_number ? errors.invoice_number : ""}
                disabled
              />,

              <FormDropdown
                key="status"
                id={"status"}
                name={"status"}
                label="Status"
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Sent", value: "sent" },
                  { label: "Paid", value: "paid" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
                optional={false}
                error={touched.status ? errors.status : ""}
              />,

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
                  { label: "Returned", value: "returned" },
                ]}
                optional={false}
                error={touched.delivery_status ? errors.delivery_status : ""}
              />,

              // CUSTOMER MODULE - LIKE CREATE INVOICE
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
                    touched.inlineCustomerName ? errors.inlineCustomerName : ""
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
                  setFieldValue("address", newValue?.value?.description ?? "");
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
                label="Invoice Date"
                type={"date"}
                optional={false}
                error={touched.invoice_date ? errors.invoice_date : ""}
              />,

              // ITEMS TABLE WITH GST
              <Box key="items-section">
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
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
                      {selectedItems.map((item:any, index:number) => {
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
                label="Notes"
                type={"text"}
                isTextArea
              />,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}