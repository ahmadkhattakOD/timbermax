// project-imports
import { Box, useTheme } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import CircularLoader from "components/CircularLoader";
import { australianStates } from "utils/helpers";
import { useEditItem } from "./useEditItem";
import InputDropdown from "components/InputDropdown";

// ==============================|| EDIT ITEM PAGE ||============================== //

export default function EditItem() {
  const {
    validate,
    onSubmit,
    item,
    loading,
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
  } = useEditItem();

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
      enableReinitialize
      initialValues={{
        name: item?.name ?? "",
        description: item?.description ?? "",
        itemCode: item?.itemCode ?? "",
        sellPrice: item?.sellPrice?.toString() ?? "",
        purchasePrice: item?.purchasePrice?.toString() ?? "",
        gst: item?.gst || false,
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
            submitButtonText={"submit"}
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
                placeholder={"Name"}
                label={"Name"}
                optional={false}
                type={"text"}
                error={touched.name ? errors.name : ("" as any)}
              />,
              <FormInput
                id={"itemCode"}
                name={"itemCode"}
                placeholder={"Item Code"}
                label={"Item Code"}
                optional={false}
                type={"text"}
                error={touched.itemCode ? errors.itemCode : ("" as any)}
              />,
              <FormInput
                id={"sellPrice"}
                name={"sellPrice"}
                placeholder={"Sell Price"}
                label={"Sell Price"}
                optional={false}
                type={"number"}
                error={touched.sellPrice ? errors.sellPrice : ("" as any)}
              />,
              <FormInput
                id={"purchasePrice"}
                name={"purchasePrice"}
                placeholder={"Purchase Price"}
                label={"Purchase Price"}
                optional={false}
                type={"number"}
                error={
                  touched.purchasePrice ? errors.purchasePrice : ("" as any)
                }
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
                  background: "#fafafa",
                }}
              >
                <FormInput
                  id={"gst"}
                  name={"gst"}
                  placeholder={"gst"}
                  label={"GST"}
                  optional={true}
                  type={"checkbox"}
                />
              </div>,
              // <FormInput
              //   id={"committed"}
              //   name={"committed"}
              //   placeholder={"Committed"}
              //   label={"committed"}
              //   type={"number"}
              //   error={touched.committed ? errors.committed : ""}
              // />,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
