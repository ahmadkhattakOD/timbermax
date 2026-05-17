import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import { useEditProfile } from "./useEditProfile";
import CircularLoader from "components/CircularLoader";
import { stripEmail } from "utils/helpers";
import ChangePassword from "components/change-password/ChangePassword";

export default function EditProfile() {
  const { validate, onSubmit, profile, loading } = useEditProfile();

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
    <>
      <Formik
        enableReinitialize
        initialValues={{
          fullName: profile.full_name ?? "",
          email: stripEmail(profile.email) ?? "",
          role: profile.role ?? "",
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ handleSubmit, errors, touched, isSubmitting }) => (
          <Form onSubmit={handleSubmit}>
            <FormLayout
              isSubmitting={isSubmitting}
              showSubmitButton={true}
              submitButtonText="save"
              inputs={[
                <FormInput
                  id="fullName"
                  name="fullName"
                  placeholder="Full Name"
                  label="full-name"
                  optional={false}
                  type="text"
                  error={touched.fullName ? errors.fullName : ""}
                />,
                <FormInput
                  id="email"
                  name="email"
                  placeholder="Username"
                  label="username"
                  optional={false}
                  type="text"
                  disabled
                />,
                <FormInput
                  id="role"
                  name="role"
                  label="role"
                  optional={false}
                  disabled
                />,
              ]}
            />
          </Form>
        )}
      </Formik>

      <ChangePassword confirmCurrentPassword={true} />
    </>
  );
}
