// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import CircularLoader from "components/CircularLoader";
import { useMoveStock } from "./useMoveStock";

// ==============================|| MOVE STOCK PAGE ||============================== //

export default function MoveStock() {
  const {
    formikRef,
    validate,
    onSubmit,
    loading,
    stocks,
    warehouses,
    onFormChange,
    selectedQuantity,
  } = useMoveStock();

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
      innerRef={formikRef}
      enableReinitialize
      initialValues={{
        fromWarehouse: "",
        item: "",
        toWarehouse: "",
        quantity: "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting }) => (
        <Form onSubmit={handleSubmit} onChange={onFormChange}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"submit"}
            inputs={[
              <FormDropdown
                id={"fromWarehouse"}
                name={"fromWarehouse"}
                label={"from-warehouse"}
                useFormattedStrings={false}
                optional={false}
                error={touched.fromWarehouse ? errors.fromWarehouse : ""}
                options={warehouses.map((warehouse) => {
                  return {
                    label: warehouse.name,
                    value: warehouse.id.toString(),
                  };
                })}
              />,
              <FormDropdown
                id={"item"}
                name={"item"}
                label={"item"}
                secondaryLabel={
                  selectedQuantity > 0 ? `${selectedQuantity} available` : null
                }
                useFormattedStrings={false}
                optional={false}
                error={touched.item ? errors.item : ""}
                options={stocks.map((stock) => {
                  return {
                    label: stock.item.name,
                    value: stock.item.id.toString(),
                  };
                })}
              />,
              <FormDropdown
                id={"toWarehouse"}
                name={"toWarehouse"}
                label={"to-warehouse"}
                useFormattedStrings={false}
                optional={false}
                error={touched.toWarehouse ? errors.toWarehouse : ""}
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
