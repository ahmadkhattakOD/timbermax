// project-imports
import FormLayout from "components/FormLayout";
import { ErrorMessage, Field, Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditQuotation } from "./use-edit-quotation";
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
import { useParams, useNavigate } from "react-router-dom";
import ActionButton from "components/ActionButton";

// ==============================|| EDIT QUOTATION PAGE ||============================== //

export default function EditQuotation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    availableStock,
    checkStockAvailability,
    initialValues,
    currentStatus,
    quotationData,
  } = useEditQuotation(id ? parseInt(id) : 0);

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
          {currentStatus !== "cancelled" && currentStatus !== "converted" && (
            <ActionButton
              text="View Details"
              onClick={() => navigate(`/quotations/view/${id}`)}
              color="info"
            />
          )}
        </Box>
      </Box>
    );
  }

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
      }) => (
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
                label="Quotation Number"
                type={"text"}
                optional={false}
                error={touched.quotation_number ? errors.quotation_number : ""}
                disabled // Quotation number should not be editable
              />,

              // Status dropdown
              <FormDropdown
                key="status"
                id={"status"}
                name={"status"}
                label="Status"
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Sent", value: "sent" },
                  { label: "Accepted", value: "accepted" },
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
                  value={selectedCustomer}
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
                value={selectedPhone}
                onChange={(e) => {
                  setSelectedPhone(e.target.value);
                }}
              />,

              <FormInput
                key="mobile"
                id={"mobile"}
                name={"mobile"}
                placeholder={"Mobile"}
                label="Mobile"
                type={"text"}
                value={selectedMobile}
                onChange={(e) => {
                  setSelectedMobile(e.target.value);
                }}
              />,

              <PlacesInput
                key="address"
                id="address"
                name="address"
                placeholder="Address"
                onChange={changeAddress}
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
                value={selectedSuburb}
                onChange={(e) => {
                  setSelectedSuburb(e.target.value);
                }}
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
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                }}
              />,

              <FormInput
                key="postCode"
                id={"postCode"}
                name={"postCode"}
                placeholder={"Post Code"}
                label="Post Code"
                type={"text"}
                value={selectedPostCode}
                onChange={(e) => {
                  setSelectedPostCode(e.target.value);
                }}
              />,

              <FormInput
                key="emailAddress"
                id={"emailAddress"}
                name={"emailAddress"}
                placeholder={"Email Address"}
                label="Email Address"
                type={"email"}
                value={selectedEmail}
                onChange={(e) => {
                  setSelectedEmail(e.target.value);
                }}
              />,

              // ITEMS TABLE
              <Box key="items-section" sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Items
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Note: Removing items will release reserved stock
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <FormDropdown
                    id={"add_item"}
                    name={"add_item"}
                    label="Add Item"
                    options={items.map((item) => ({
                      label: `${item.name} (${item.itemCode}) - $${item.sellPrice} (Available: ${availableStock[item.id] || 0})`,
                      value: item.id.toString(),
                    }))}
                    onChange={(e) => {
                      const itemId = parseInt(e.target.value);
                      if (itemId) {
                        const item = items.find((i) => i.id === itemId);
                        if (item) {
                          // Check stock availability before adding
                          const available = availableStock[item.id] || 0;
                          if (available <= 0) {
                            alert(`Item "${item.name}" is out of stock!`);
                            return;
                          }

                          addItem({
                            item_id: item.id,
                            name: item.name,
                            itemCode: item.itemCode,
                            quantity: 1,
                            unit_price: item.sellPrice,
                            total: item.sellPrice,
                            available_stock: available,
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
                      {selectedItems.map((item, index) => {
                        const available = availableStock[item.item_id] || 0;
                        const totalRequested = selectedItems
                          .filter((i) => i.item_id === item.item_id)
                          .reduce((sum, i) => sum + i.quantity, 0);

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
                                    const newQuantity =
                                      parseFloat(e.target.value) || 0;
                                    if (newQuantity < 1) {
                                      alert("Quantity must be at least 1");
                                      return;
                                    }
                                    if (newQuantity > available) {
                                      const remaining =
                                        available -
                                        (totalRequested - item.quantity);
                                      alert(
                                        `Cannot select more than ${remaining} items. Only ${remaining} available after accounting for other selections.`
                                      );
                                      return;
                                    }
                                    updateItem(index, "quantity", newQuantity);
                                  }}
                                  style={{
                                    width: "80px",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                  }}
                                  min={1}
                                  max={available}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Max: {available}
                                </Typography>
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
                            <TableCell>
                              ${(item.quantity * item.unit_price).toFixed(2)}
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

              // <FormInput
              //   key="valid_until"
              //   id={"valid_until"}
              //   name={"valid_until"}
              //   placeholder={"Valid Until"}
              //   label="Valid Until"
              //   type={"date"}
              // />,

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
