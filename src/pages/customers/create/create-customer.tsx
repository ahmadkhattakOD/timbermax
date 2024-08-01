// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateCustomer } from "./useCreateCustomer";
import {
  australianStates,
  getDateFormatted,
  getDateFormattedForField,
  getDateTimeFormatted,
} from "utils/helpers";
import PlacesInput from "components/PlacesInput";

// ==============================|| CREATE CUSTOMER PAGE ||============================== //

export default function CreateCustomer() {
  const {
    validate,
    onSubmit,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
  } = useCreateCustomer();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: "",
        milestone: "",
        expectedCloseDate: "",
        email: "",
        phone: "",
        mobile: "",
        address: "",
        suburb: "",
        state: "",
        postCode: "",
        lostReason: "",
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
                id={"email"}
                name={"email"}
                placeholder={"Email"}
                label={"email"}
                type={"text"}
                error={touched.email ? errors.email : ""}
              />,
              <FormInput
                id={"phone"}
                name={"phone"}
                placeholder={"Phone"}
                label={"phone"}
                type={"text"}
                error={touched.phone ? errors.phone : ""}
              />,
              <FormInput
                id={"mobile"}
                name={"mobile"}
                placeholder={"Mobile"}
                label={"mobile"}
                type={"text"}
                error={touched.mobile ? errors.mobile : ""}
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
              values.milestone === "lost" && (
                <FormInput
                  id={"lostReason"}
                  name={"lostReason"}
                  placeholder={"Lost Reason"}
                  label={"lost-reason"}
                  type={"text"}
                  isTextArea
                />
              ),
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
