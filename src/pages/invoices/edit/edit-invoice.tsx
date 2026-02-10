// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { InvoiceItem, useEditInvoice } from "./use-edit-invoice";
import { australianStates, calculateItemTotal } from "utils/helpers";
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
  Select,
  MenuItem,
  FormControl,
  Chip,
  Alert,
  Grid,
} from "@mui/material";

import { Add, Trash } from "iconsax-react";
import PlacesInput from "components/PlacesInput";
import InputDropdown from "components/InputDropdown";
import { useParams, useNavigate } from "react-router-dom";
import ActionButton from "components/ActionButton";
import { useEffect } from "react";

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
    customerName,
    setCustomerName,
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    handleAddressSelect,
    customerId,
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
            {invoiceData?.delivery_status?.charAt(0).toUpperCase() +
              invoiceData?.delivery_status?.slice(1) || "Pending"}
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
      }) => {
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

        return (
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

                // CUSTOMER MODULE
                !createInlineCustomer ? (
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
                />,

                // CONTACT DETAILS
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
                />,

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
                  value={values.invoice_date}
                  onChange={(e) => {
                    setFieldValue("invoice_date", e.target.value);
                  }}
                />,

                // ADDRESS SECTION - full width (MATCHES QUOTATION LOGIC)
                <Box key="address-section" {...{fullWidth: true}}>
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
                  value={values.note}
                  onChange={(e) => {
                    setFieldValue("note", e.target.value);
                  }}
                />,

                // ITEMS TABLE WITH GST - full width at end
                <Box key="items-section" {...{fullWidth: true}}>
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
                  
                  {selectedItems.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No items in this invoice. Add items to update.
                    </Alert>
                  ) : (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Warehouse</TableCell>
                            <TableCell>Available</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Unit Price</TableCell>
                            <TableCell>GST</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedItems.map(
                            (item: InvoiceItem, index: number) => {
                              // Find the selected warehouse info
                              const selectedWarehouse = item.warehouse_id
                                ? item.available_warehouses.find(
                                    (w) => w.id === item.warehouse_id,
                                  )
                                : null;

                              const availableStock =
                                selectedWarehouse?.available || 0;
                              const currentQuantity = parseFloat(item.quantity);
                              const isLowStock = availableStock < currentQuantity;
                              const isNegativeStock = availableStock < 0;

                              return (
                                <TableRow
                                  key={index}
                                  sx={{
                                    backgroundColor: isNegativeStock
                                      ? "rgba(255, 0, 0, 0.05)"
                                      : isLowStock
                                        ? "rgba(255, 165, 0, 0.05)"
                                        : "inherit",
                                  }}
                                >
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>{item.itemCode}</TableCell>

                                  <TableCell>
                                    <FormControl
                                      size="small"
                                      sx={{ minWidth: 150 }}
                                      error={!item.warehouse_id}
                                    >
                                      <Select
                                        value={item.warehouse_id || ""}
                                        onChange={(e) =>
                                          updateItem(
                                            index,
                                            "warehouse_id",
                                            Number(e.target.value),
                                          )
                                        }
                                        displayEmpty
                                        disabled={
                                          item.available_warehouses.length === 1
                                        }
                                      >
                                        <MenuItem value="" disabled>
                                          Select Warehouse
                                        </MenuItem>
                                        {item.available_warehouses.map(
                                          (warehouse) => {
                                            // Determine status color
                                            let statusColor = "text.primary";
                                            if (warehouse.available < 0)
                                              statusColor = "error.main";
                                            else if (
                                              warehouse.available <
                                              currentQuantity
                                            )
                                              statusColor = "warning.main";
                                            else statusColor = "success.main";

                                            return (
                                              <MenuItem
                                                key={warehouse.id}
                                                value={warehouse.id}
                                              >
                                                <Box
                                                  sx={{
                                                    display: "flex",
                                                    justifyContent:
                                                      "space-between",
                                                    width: "100%",
                                                  }}
                                                >
                                                  <Typography variant="body2">
                                                    {warehouse.name}
                                                  </Typography>
                                                  <Typography
                                                    variant="body2"
                                                    sx={{
                                                      color: statusColor,
                                                      fontWeight:
                                                        warehouse.available <
                                                        currentQuantity
                                                          ? "bold"
                                                          : "normal",
                                                    }}
                                                  >
                                                    {warehouse.available} avail
                                                  </Typography>
                                                </Box>
                                              </MenuItem>
                                            );
                                          },
                                        )}
                                      </Select>
                                      {!item.warehouse_id && (
                                        <Typography
                                          variant="caption"
                                          color="error"
                                        >
                                          Required
                                        </Typography>
                                      )}
                                    </FormControl>
                                  </TableCell>

                                  <TableCell>
                                    {selectedWarehouse ? (
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                        }}
                                      >
                                        <Typography
                                          variant="body2"
                                          color={
                                            isNegativeStock
                                              ? "error"
                                              : isLowStock
                                                ? "warning"
                                                : "success"
                                          }
                                          fontWeight={
                                            isLowStock || isNegativeStock
                                              ? "bold"
                                              : "normal"
                                          }
                                        >
                                          {availableStock}
                                        </Typography>
                                        {isNegativeStock && (
                                          <Chip
                                            label="Negative"
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            sx={{
                                              height: 20,
                                              fontSize: "0.7rem",
                                            }}
                                          />
                                        )}
                                        {isLowStock && !isNegativeStock && (
                                          <Chip
                                            label="Low"
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                            sx={{
                                              height: 20,
                                              fontSize: "0.7rem",
                                            }}
                                          />
                                        )}
                                      </Box>
                                    ) : (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Select warehouse
                                      </Typography>
                                    )}
                                  </TableCell>

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
                                            parseFloat(e.target.value),
                                          );
                                        }}
                                        style={{
                                          width: "80px",
                                          padding: "8px",
                                          border: `1px solid ${
                                            isNegativeStock
                                              ? "#f44336"
                                              : isLowStock
                                                ? "#ff9800"
                                                : "#ccc"
                                          }`,
                                          borderRadius: "4px",
                                          backgroundColor: isNegativeStock
                                            ? "#ffebee"
                                            : isLowStock
                                              ? "#fffaf0"
                                              : "white",
                                        }}
                                        min={1}
                                      />
                                      {(isLowStock || isNegativeStock) && (
                                        <Typography
                                          variant="caption"
                                          color={
                                            isNegativeStock ? "error" : "warning"
                                          }
                                          sx={{ display: "block", mt: 0.5 }}
                                        >
                                          {isNegativeStock
                                            ? "Negative stock will be created"
                                            : "Will create negative stock"}
                                        </Typography>
                                      )}
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
                                          parseFloat(e.target.value) || 0,
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
                                    <Typography
                                      fontWeight="bold"
                                      color={
                                        isNegativeStock
                                          ? "error"
                                          : isLowStock
                                            ? "warning"
                                            : "inherit"
                                      }
                                    >
                                      ${calculateItemTotal(item).toFixed(2)}
                                    </Typography>
                                  </TableCell>

                                  <TableCell>
                                    <IconButton onClick={() => removeItem(index)}>
                                      <Trash size={20} />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            },
                          )}

                          {/* Warning row for negative stock items */}
                          {selectedItems.some((item) => {
                            const selectedWarehouse = item.warehouse_id
                              ? item.available_warehouses.find(
                                  (w) => w.id === item.warehouse_id,
                                )
                              : null;
                            const availableStock =
                              selectedWarehouse?.available || 0;
                            const currentQuantity = parseFloat(item.quantity);
                            return availableStock < currentQuantity;
                          }) && (
                            <TableRow>
                              <TableCell colSpan={9}>
                                <Box
                                  sx={{
                                    p: 2,
                                    backgroundColor: "warning.light",
                                    borderRadius: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography variant="body2" fontWeight="bold">
                                    ⚠️ Low Stock Alert:
                                  </Typography>
                                  <Typography variant="body2">
                                    Some items will create negative stock. Invoice
                                    will still be created.
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}

                          {/* Total row */}
                          <TableRow>
                            <TableCell colSpan={7} align="right">
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
                  )}
                </Box>,
              ]}
            />
          </Form>
        );
      }}
    </Formik>
  );
}