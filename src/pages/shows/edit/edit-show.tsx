// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditShow } from "./useEditShow";
import CircularLoader from "components/CircularLoader";
import {
  australianStates,
  getDateFormatted,
  getDateFormattedForField,
  getDateTimeFormatted,
} from "utils/helpers";
import PlacesInput from "components/PlacesInput";

// ==============================|| EDIT SHOW PAGE ||============================== //

export default function EditShow() {
  const {
    validate,
    onSubmit,
    show,
    loading,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
  } = useEditShow();

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
        name: show.name ?? "",
        startDate: show.start_date
          ? getDateFormattedForField(show.start_date)
          : "",
        endDate: show.end_date ? getDateFormattedForField(show.end_date) : "",
        address: show.address ?? "",
        suburb: show.suburb ?? "",
        state: show.state ?? "",
        postCode: show.post_code ?? "",
        notes: show.notes ?? "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting, values }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"submit"}
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
