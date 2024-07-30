// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditCommunication } from "./useEditCommunication";
import CircularLoader from "components/CircularLoader";
import { australianStates, getDateFormattedForField } from "utils/helpers";
import PlacesInput from "components/PlacesInput";

// ==============================|| EDIT COMMUNICATION PAGE ||============================== //

export default function EditCommunication() {
  const { validate, onSubmit, communication, loading } = useEditCommunication();

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
        method: communication.method ?? "",
        date: communication.date
          ? getDateFormattedForField(communication.date)
          : "",
        notes: communication.notes ?? "",
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
