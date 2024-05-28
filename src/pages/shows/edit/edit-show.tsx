// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditShow } from "./useEditShow";
import CircularLoader from "components/CircularLoader";
import { australianStates, getDateTimeFormatted } from "utils/helpers";

// ==============================|| EDIT WAREHOUSE PAGE ||============================== //

export default function EditShow() {
  const { validate, onSubmit, show, loading } = useEditShow();

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
        startDate: show.start_date ? getDateTimeFormatted(show.start_date) : "",
        endDate: show.end_date ? getDateTimeFormatted(show.end_date) : "",
        address: show.address ?? "",
        state: show.state ?? "",
        postCode: show.post_code ?? "",
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
