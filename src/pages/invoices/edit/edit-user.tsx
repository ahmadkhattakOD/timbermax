// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditUser } from "./useEditUser";
import CircularLoader from "components/CircularLoader";
import {
  australianStates,
  getDateFormatted,
  getDateTimeFormatted,
  userRoles,
} from "utils/helpers";

// ==============================|| EDIT USER PAGE ||============================== //

export default function EditUser() {
  const { validate, onSubmit, profile, loading } = useEditUser();

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
        fullName: profile.full_name ?? "",
        email: profile.email ?? "",
        role: profile.role ?? "",
        commission: profile.commission ? profile.commission.toString() : "",
        dailyWage: profile.daily_wage ? profile.daily_wage.toString() : "",
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
                id={"fullName"}
                name={"fullName"}
                placeholder={"Full Name"}
                label={"full-name"}
                optional={false}
                type={"text"}
                error={touched.fullName ? errors.fullName : ""}
              />,
              <FormInput
                id={"email"}
                name={"email"}
                placeholder={"Email"}
                label={"email"}
                optional={false}
                type={"email"}
                disabled
                error={touched.email ? errors.email : ""}
              />,
              <FormDropdown
                id={"role"}
                name={"role"}
                label={"role"}
                useFormattedStrings={false}
                optional={false}
                options={userRoles}
                error={touched.role ? errors.role : ""}
              />,
              <FormInput
                id={"commission"}
                name={"commission"}
                placeholder={"Commission"}
                label={"commission"}
                type={"number"}
              />,
              <FormInput
                id={"dailyWage"}
                name={"dailyWage"}
                placeholder={"Daily Wage"}
                label={"daily-wage"}
                type={"number"}
              />,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
