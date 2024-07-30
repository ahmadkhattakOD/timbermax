// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateCommunication } from "./useCreateCommunication";

// ==============================|| CREATE COMMUNICATION PAGE ||============================== //

export default function CreateCommunication() {
  const { validate, onSubmit } = useCreateCommunication();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        method: "",
        date: "",
        notes: "",
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
                id={"method"}
                name={"method"}
                label={"method"}
                optional={false}
                options={["call", "in-person-meeting", "email", "other"]}
                error={touched.method ? errors.method : ""}
              />,
              <FormInput
                id={"date"}
                name={"date"}
                placeholder={"Date"}
                label={"date"}
                type={"date"}
                optional={false}
                error={touched.date ? errors.date : ""}
              />,
              <FormInput
                id={"notes"}
                name={"notes"}
                placeholder={"Notes"}
                label={"notes"}
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
