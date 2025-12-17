// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateItem } from "./useCreateItem";
import { australianStates, getDateFormatted } from "utils/helpers";

// ==============================|| CREATE ITEM PAGE ||============================== //

export default function CreateItem() {
  const { validate, onSubmit } = useCreateItem();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: "",
        description: "",
        itemCode: "",
        sellPrice: "",
        purchasePrice: "",
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
              <FormInput
                id={"name"}
                name={"name"}
                placeholder={"Name"}
                label={"name"}
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
                label={"Sell Price"}
                optional={false}
                type={"number"}
                // inputProps={{ min: 0, step: "0.01" }}
                error={touched.sellPrice ? errors.sellPrice : ""}
              />,
              <FormInput
                id={"purchasePrice"}
                name={"purchasePrice"}
                placeholder={"Purchase Price"}
                label={"Purchase price"}
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
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}