// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateShow } from "./useCreateShow";
import {
  australianStates,
  getDateFormatted,
  getDateTimeFormatted,
} from "utils/helpers";
import PlacesInput from "components/PlacesInput";

// ==============================|| CREATE SHOW PAGE ||============================== //

export default function CreateShow() {
  const {
    validate,
    onSubmit,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
  } = useCreateShow();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: "",
        startDate: "",
        endDate: "",
        address: "",
        suburb: "",
        state: "",
        postCode: "",
        notes: "",
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
                type={"date"}
                min={getDateFormatted()}
                error={touched.startDate ? errors.startDate : ""}
              />,
              <FormInput
                id={"endDate"}
                name={"endDate"}
                placeholder={"End Date"}
                label={"end-date"}
                type={"date"}
                min={
                  values.startDate !== ""
                    ? values.startDate
                    : getDateFormatted()
                }
                max={new Date()}
                error={touched.endDate ? errors.endDate : ""}
              />,
              <PlacesInput
                id="address"
                name="address"
                placeholder="Address"
                onChange={changeAddress}
                value={selectedAddress}
                label="address"
              />,
              <FormInput
                id={"suburb"}
                name={"suburb"}
                placeholder={"Suburb"}
                label={"suburb"}
                type={"text"}
                value={selectedSuburb}
                onChange={(e) => {
                  setSelectedSuburb(e.target.value);
                }}
              />,
              <FormDropdown
                id={"state"}
                name={"state"}
                label={"state"}
                useFormattedStrings={false}
                options={australianStates}
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                }}
              />,
              <FormInput
                id={"postCode"}
                name={"postCode"}
                placeholder={"Post Code"}
                label={"post-code"}
                type={"text"}
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
