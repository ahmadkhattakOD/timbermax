// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateUser } from "./useCreateUser";
import { UserRoles, userRoles } from "utils/helpers";

// ==============================|| CREATE USER PAGE ||============================== //

export default function CreateUser() {
  const { validate, onSubmit, selectedRole, setSelectedRole } = useCreateUser();

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
        secondaryCommission: "",
        dailyWage: "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting, }) => (
        <Form onSubmit={handleSubmit} autoComplete="off">
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"add"}
            inputs={
              selectedRole === UserRoles.Both
                ? [
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
                      placeholder={"Username"}
                      label={"username"}
                      optional={false}
                      type={"text"}
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
                      error={
                        touched.confirmPassword ? errors.confirmPassword : ""
                      }
                    />,
                    <FormDropdown
                      id={"role"}
                      name={"role"}
                      label={"role"}
                      useFormattedStrings={false}
                      optional={false}
                      options={userRoles}
                      value={selectedRole}
                      onChange={(e) => {
                        setSelectedRole(e.target.value);
                      }}
                      error={touched.role ? errors.role : ""}
                    />,
                    <FormInput
                      id={"commission"}
                      name={"commission"}
                      placeholder={"Sales Person Commission (%)"}
                      label={"sales-commission-percentage"}
                      type={"number"}
                      optional={false}
                      error={touched.commission ? errors.commission : ""}
                    />,
                    <FormInput
                      id={"secondaryCommission"}
                      name={"secondaryCommission"}
                      placeholder={"Closer Commission (%)"}
                      label={"closing-commission-percentage"}
                      type={"number"}
                      optional={false}
                      error={
                        touched.secondaryCommission
                          ? errors.secondaryCommission
                          : ""
                      }
                    />,
                    <FormInput
                      id={"dailyWage"}
                      name={"dailyWage"}
                      placeholder={"Daily Wage"}
                      label={"daily-wage"}
                      type={"number"}
                    />,
                  ]
                : [
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
                      placeholder={"Username"}
                      label={"username"}
                      optional={false}
                      type={"text"}
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
                      error={
                        touched.confirmPassword ? errors.confirmPassword : ""
                      }
                    />,
                    <FormDropdown
                      id={"role"}
                      name={"role"}
                      label={"role"}
                      useFormattedStrings={false}
                      optional={false}
                      options={userRoles}
                      value={selectedRole}
                      onChange={(e) => {
                        setSelectedRole(e.target.value);
                      }}
                      error={touched.role ? errors.role : ""}
                    />,
                    <FormInput
                      id={"commission"}
                      name={"commission"}
                      placeholder={"Commission (%)"}
                      label={"commission-percentage"}
                      type={"number"}
                      optional={false}
                      error={touched.commission ? errors.commission : ""}
                    />,
                    <FormInput
                      id={"dailyWage"}
                      name={"dailyWage"}
                      placeholder={"Daily Wage"}
                      label={"daily-wage"}
                      type={"number"}
                    />,
                  ]
            }
          />
        </Form>
      )}
    </Formik>
  );
}
