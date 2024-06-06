// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import CircularLoader from "components/CircularLoader";
import { australianStates } from "utils/helpers";
import { useEditStock } from "./useEditStock";

// ==============================|| EDIT WAREHOUSE PAGE ||============================== //

export default function EditStock() {
  const { validate, onSubmit, stock, loading, items, warehouses } =
    useEditStock();

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
        item: stock.item.id.toString() ?? "",
        warehouse: stock.warehouse.id.toString() ?? "",
        quantity: stock.quantity.toString() ?? "",
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
                  return {
                    label: warehouse.name,
                    value: warehouse.id.toString(),
                  };
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
