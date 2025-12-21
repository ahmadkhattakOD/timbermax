import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditQuotation } from "./use-edit-quotation";
import { australianStates } from "utils/helpers";
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
    setSelectedSuburb,
    setSelectedState,
    setSelectedEmail,
    setSelectedPhone,
    setSelectedMobile,
    setSelectedPostCode,
    selectedItemId,
    setSelectedItemId,
    handleItemSearchDebounced,
    initialValues,
    currentStatus,
    quotationData,
    customerName,
    setCustomerName,
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
          {/* {currentStatus !== "cancelled" && currentStatus !== "converted" && (
            <ActionButton
              text="View Details"
              onClick={() => navigate(`/quotations/view/${id}`)}
              color="info"
            />
          )} */}
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
                value={customerName}
                onChange={(e) => {
                  setFieldValue("customerName", e.target.value);
                  setCustomerName(e.target.value);
                }}
              />,

              <FormInput
                key="phone"
                id={"phone"}
                name={"phone"}
                placeholder={"Phone"}
                label="Phone"
                type={"text"}
                value={selectedPhone}
                onChange={(e) => {
                  setFieldValue("phone", e.target.value);
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
                  setFieldValue("mobile", e.target.value);
                  setSelectedMobile(e.target.value);
                }}
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
                value={selectedSuburb}
                onChange={(e) => {
                  setFieldValue("suburb", e.target.value);
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
                  setFieldValue("state", e.target.value);
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
                  setFieldValue("postCode", e.target.value);
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
                  setFieldValue("emailAddress", e.target.value);
                  setSelectedEmail(e.target.value);
                }}
              />,

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
                                    const newQuantity =
                                      parseFloat(e.target.value) || 0;
                                    if (newQuantity < 1) {
                                      alert("Quantity must be at least 1");
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