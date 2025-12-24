// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import CircularLoader from "components/CircularLoader";
import { australianStates } from "utils/helpers";
import { useEditItem } from "./useEditItem";

// ==============================|| EDIT ITEM PAGE ||============================== //

export default function EditItem() {
  const { validate, onSubmit, item, loading } = useEditItem();

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
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"submit"}
            inputs={[
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
