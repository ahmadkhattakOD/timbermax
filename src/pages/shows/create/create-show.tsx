// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateShow } from "./useCreateShow";
import { australianStates, getDateFormatted, getDateTimeFormatted } from "utils/helpers";

// ==============================|| CREATE WAREHOUSE PAGE ||============================== //

export default function CreateShow() {
  const { validate, onSubmit } = useCreateShow();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: "",
        startDate: "",
        endDate: "",
        address: "",
        state: "",
        postCode: "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting, values }) => (
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
                id={"startDate"}
                name={"startDate"}
                placeholder={"Start Date"}
                label={"start-date"}
                optional={false}
                type={"datetime-local"}
                min={getDateTimeFormatted()}
                error={touched.startDate ? errors.startDate : ""}
              />,
              <FormInput
                id={"endDate"}
                name={"endDate"}
                placeholder={"End Date"}
                label={"end-date"}
                type={"datetime-local"}
                min={
                  values.startDate !== ""
                    ? values.startDate
                    : getDateTimeFormatted()
                }
                max={new Date()}
                error={touched.endDate ? errors.endDate : ""}
              />,
              <FormInput
                id={"address"}
                name={"address"}
                placeholder={"Address"}
                label={"address"}
                type={"text"}
              />,
              <FormDropdown
                id={"state"}
                name={"state"}
                label={"state"}
                useFormattedStrings={false}
                options={australianStates}
              />,
              <FormInput
                id={"postCode"}
                name={"postCode"}
                placeholder={"Post Code"}
                label={"post-code"}
                type={"text"}
              />,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
