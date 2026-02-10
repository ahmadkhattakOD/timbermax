import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditQuotation } from "./use-edit-quotation";
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

// ==============================|| EDIT QUOTATION PAGE ||============================== //

export default function EditQuotation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    validate,
    onSubmit,
    items,
    loading,
    selectedItems,
    addItem,
    removeItem,
    updateItem,
    totalAmount,
    loadingItems,
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
    initialValues,
    currentStatus,
    quotationData,
    customerName,
    setCustomerName,
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    handleAddressSelect,
    customerId,
  } = useEditQuotation(id ? parseInt(id) : 0);

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

  if (!quotationData && !loading) {
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
        <Typography variant="h6">Quotation not found</Typography>
        <ActionButton
          text="Back to Quotations"
          onClick={() => navigate("/quotations")}
        />
      </Box>
    );
  }

  // Check if quotation can be edited
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
          This quotation cannot be edited
        </Typography>
        <Typography variant="body1" textAlign="center">
          Only draft and sent quotations can be edited.
          <br />
          Current status:{" "}
          <strong>
            {currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1)}
          </strong>
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <ActionButton
            text="Back to Quotations"
            onClick={() => navigate("/quotations")}
          />
        </Box>
      </Box>
    );
  }

  // Calculate low stock items for warning
  const lowStockItems = selectedItems.filter(item => {
    if (item.warehouse_id) {
      const selectedWarehouse = item.available_warehouses.find(
        w => w.id === item.warehouse_id
      );
      const requestedQuantity = parseFloat(item.quantity);
      return selectedWarehouse && requestedQuantity > selectedWarehouse.available;
    }
    return false;
  });

  return (
    <Formik
      enableReinitialize
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
              submitButtonText="Update Quotation"
              cancelButtonText="Cancel"
              onCancel={() => navigate("/quotations")}
              inputs={[
                <FormInput
                  key="quotation_number"
                  id={"quotation_number"}
                  name={"quotation_number"}
                  placeholder={"Quotation Number"}
                  label="Quote Number"
                  type={"text"}
                  optional={false}
                  error={touched.quotation_number ? errors.quotation_number : ""}
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
                    { label: "Approved", value: "approved" },
                    { label: "Cancelled", value: "cancelled" },
                  ]}
                  optional={false}
                  error={touched.status ? errors.status : ""}
                />,

                <FormInput
                  key="customerName"
                  id={"customerName"}
                  name={"customerName"}
                  placeholder={"Customer Name"}
                  label="Customer Name"
                  type={"text"}
                  optional={false}
                  error={touched.customerName ? errors.customerName : ""}
                  value={values.customerName}
                  onChange={(e) => {
                    setFieldValue("customerName", e.target.value);
                    setCustomerName(e.target.value);
                  }}
                />,

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

                // ADDRESS SECTION - full width
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

                // VALID UNTIL DATE
                <FormInput
                  key="valid_until"
                  id={"valid_until"}
                  name={"valid_until"}
                  placeholder={"Valid Until"}
                  label="Valid Until"
                  type={"date"}
                  value={values.valid_until}
                  onChange={(e) => {
                    setFieldValue("valid_until", e.target.value);
                  }}
                />,

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

                // Low stock warning banner - full width
                lowStockItems.length > 0 ? (
                  <Alert
                    key="low-stock-warning"
                    severity="warning"
                    {...{fullWidth: true}}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        Stock Reservation Alert
                      </Typography>
                      <Typography variant="body2">
                        {lowStockItems.length} item(s) have insufficient stock. Changes will still be saved.
                      </Typography>
                    </Box>
                  </Alert>
                ) : null,

                // ITEMS TABLE WITH WAREHOUSE SELECTION - full width, at the end
                <Box key="items-section" {...{fullWidth: true}}>
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

                  {selectedItems.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No items in this quotation. Add items to update.
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
                          {selectedItems.map((item, index) => {
                            const selectedWarehouse = item.warehouse_id
                              ? item.available_warehouses.find(w => w.id === item.warehouse_id)
                              : null;

                            const availableStock = selectedWarehouse?.available || 0;
                            const currentQuantity = parseFloat(item.quantity);
                            const isLowStock = availableStock < currentQuantity;

                            return (
                              <TableRow
                                key={index}
                                sx={{
                                  backgroundColor: isLowStock ? 'rgba(255, 165, 0, 0.05)' : 'inherit'
                                }}
                              >
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.itemCode}</TableCell>

                                <TableCell>
                                  <FormControl
                                    size="small"
                                    sx={{ minWidth: 120 }}
                                    error={!item.warehouse_id}
                                  >
                                    <Select
                                      value={item.warehouse_id || ''}
                                      onChange={(e) => updateItem(index, "warehouse_id", Number(e.target.value))}
                                      displayEmpty
                                      disabled={item.available_warehouses.length === 1}
                                    >
                                      <MenuItem value="" disabled>
                                        Select Warehouse
                                      </MenuItem>
                                      {item.available_warehouses.map((warehouse) => (
                                        <MenuItem
                                          key={warehouse.id}
                                          value={warehouse.id}
                                        >
                                          {warehouse.name} ({warehouse.available} available)
                                        </MenuItem>
                                      ))}
                                    </Select>
                                    {!item.warehouse_id && (
                                      <Typography variant="caption" color="error">
                                        Required
                                      </Typography>
                                    )}
                                  </FormControl>
                                </TableCell>

                                <TableCell>
                                  {selectedWarehouse ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography
                                        variant="body2"
                                        color={availableStock < 0 ? "error" : availableStock < currentQuantity ? "warning" : "success"}
                                        fontWeight={availableStock < currentQuantity ? "bold" : "normal"}
                                      >
                                        {availableStock}
                                      </Typography>
                                      {isLowStock && (
                                        <Chip
                                          label="Low"
                                          size="small"
                                          color="warning"
                                          variant="outlined"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      )}
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
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
                                        border: `1px solid ${isLowStock ? '#ff9800' : '#ccc'}`,
                                        borderRadius: "4px",
                                        backgroundColor: isLowStock ? '#fffaf0' : 'white'
                                      }}
                                      min={1}
                                    />
                                    {isLowStock && (
                                      <Typography
                                        variant="caption"
                                        color="warning"
                                        sx={{ display: 'block', mt: 0.5 }}
                                      >
                                        Insufficient stock
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