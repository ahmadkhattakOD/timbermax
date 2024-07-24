// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateStock } from "./useCreateStock";
import { Box } from "@mui/system";
import CircularLoader from "components/CircularLoader";

// ==============================|| CREATE STOCK PAGE ||============================== //

export default function CreateStock() {
  const { items, warehouses, loading, validate, onSubmit } = useCreateStock();

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
        item: "",
        warehouse: "",
        quantity: "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"add"}
            inputs={[
              <FormDropdown
                id={"item"}
                name={"item"}
                label={"item"}
                useFormattedStrings={false}
                optional={false}
                error={touched.item ? errors.item : ""}
                options={items.map((item) => {
                  return { label: item.name, value: item.id.toString() };
                })}
              />,
              <FormDropdown
                id={"warehouse"}
                name={"warehouse"}
                label={"warehouse"}
                useFormattedStrings={false}
                optional={false}
                error={touched.warehouse ? errors.warehouse : ""}
                options={warehouses.map((warehouse) => {
                  return { label: warehouse.name, value: warehouse.id.toString() };
                })}
              />,
              <FormInput
                id={"quantity"}
                name={"quantity"}
                placeholder={"Quantity"}
                label={"quantity"}
                type={"number"}
                optional={false}
                error={touched.quantity ? errors.quantity : ""}
              />,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
