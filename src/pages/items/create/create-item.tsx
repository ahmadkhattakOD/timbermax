// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateItem } from "./useCreateItem";
import { australianStates, getDateFormatted } from "utils/helpers";
import InputDropdown from "components/InputDropdown";
import { Box, useTheme } from "@mui/material";

// ==============================|| CREATE ITEM PAGE ||============================== //

export default function CreateItem() {
  const {
    validate,
    onSubmit,
    vendors,
    loadingVendors,
    handleVendorSearchDebounced,
    createInlineVendor,
    setCreateInlineVendor,
    selectedVendor,
    setSelectedVendor,
    inlineVendorName,
    setInlineVendorName,
    vendorName,
    setVendorName,
  } = useCreateItem();

  const theme = useTheme();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: "",
        description: "",
        itemCode: "",
        sellPrice: "",
        purchasePrice: "",
        gst: true,
        vendorName: vendorName || "",
        inlineVendorName: inlineVendorName || "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"add"}
            inputs={[
              !createInlineVendor ? (
                <InputDropdown
                  key="vendorName"
                  id="vendorName"
                  name="vendorName"
                  label="Vendor Name"
                  options={vendors}
                  value={
                    vendors.find((v) => v.id === selectedVendor) || null
                  }
                  secondaryLabel={
                    <Box
                      sx={{
                        color: theme.palette.primary.main,
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        setCreateInlineVendor(true);
                      }}
                    >
                      Create New Vendor
                    </Box>
                  }
                  loading={loadingVendors}
                  optional={true}
                  onChange={handleVendorSearchDebounced}
                  onSelect={(e) => {
                    setSelectedVendor(e.target.value);
                  }}
                  error={errors.vendorName}
                />
              ) : (
                <FormInput
                  key="inlineVendorName"
                  id={"inlineVendorName"}
                  name={"inlineVendorName"}
                  placeholder={"Vendor Name"}
                  label="Vendor Name"
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
                        setCreateInlineVendor(false);
                        setInlineVendorName("");
                        setFieldValue("inlineVendorName", "");
                      }}
                    >
                      Use Existing Vendor
                    </Box>
                  }
                  error={
                    touched.inlineVendorName
                      ? errors.inlineVendorName
                      : ""
                  }
                  onChange={(e) => {
                    setFieldValue("inlineVendorName", e.target.value);
                    setInlineVendorName(e.target.value);
                  }}
                  value={values.inlineVendorName}
                />
              ),
              <FormInput
                id={"name"}
                name={"name"}
                placeholder={"Item Specifications"}
                label={"Item Specifications"}
                optional={false}
                type={"text"}
                error={touched.name ? errors.name : ""}
              />,

              <FormInput
                id={"itemCode"}
                name={"itemCode"}
                placeholder={"Item Code"}
                label={"Item Code"}
                optional={false}
                type={"text"}
                error={touched.itemCode ? errors.itemCode : ""}
              />,
              <FormInput
                id={"sellPrice"}
                name={"sellPrice"}
                placeholder={"Sell Price"}
                label={"Sell Price (ex GST)"}
                optional={false}
                type={"number"}
                // inputProps={{ min: 0, step: "0.01" }}
                error={touched.sellPrice ? errors.sellPrice : ""}
              />,
              <FormInput
                id={"purchasePrice"}
                name={"purchasePrice"}
                placeholder={"Purchase Price"}
                label={"Purchase price (ex GST)"}
                optional={false}
                type={"number"}
                // inputProps={{ min: 0, step: "0.01" }}
                error={touched.purchasePrice ? errors.purchasePrice : ""}
              />,
              <FormInput
                id={"description"}
                name={"description"}
                placeholder={"Description"}
                label={"description"}
                type={"text"}
              />,
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  maxWidth: "10%",
                }}
              >
                <FormInput
                  id={"gst"}
                  name={"gst"}
                  placeholder={"GST"}
                  secondaryLabel={null}
                  label={"GST"}
                  optional={true}
                  type={"checkbox"}
                  error={touched.name ? errors.name : ""}
                />
              </div>,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
