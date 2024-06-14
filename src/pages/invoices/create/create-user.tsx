// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateUser } from "./useCreateUser";
import { userRoles } from "utils/helpers";

// ==============================|| CREATE USER PAGE ||============================== //

export default function CreateUser() {
  const { validate, onSubmit } = useCreateUser();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
        commission: "",
        dailyWage: "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting, values }) => (
        <Form onSubmit={handleSubmit} autoComplete="off">
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"add"}
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
                error={touched.email ? errors.email : ""}
              />,
              <FormInput
                id={"password"}
                name={"password"}
                placeholder={"Password"}
                label={"password"}
                optional={false}
                type={"password"}
                error={touched.password ? errors.password : ""}
              />,
              <FormInput
                id={"confirmPassword"}
                name={"confirmPassword"}
                placeholder={"Confirm Password"}
                label={"confirm-password"}
                optional={false}
                type={"password"}
                error={touched.confirmPassword ? errors.confirmPassword : ""}
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
