// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import { useCreateOpportunityDescription } from "./useCreateOpportunityDescription";

// ==============================|| CREATE OPPORTUNITY DESCRIPTION PAGE ||============================== //

export default function CreateOpportunityDescription() {
  const { validate, onSubmit } = useCreateOpportunityDescription();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: "",
        description: "",
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
