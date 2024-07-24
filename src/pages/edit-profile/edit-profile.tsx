// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditProfile } from "./useEditProfile";
import CircularLoader from "components/CircularLoader";
import { UserRoles, stripEmail, userRoles } from "utils/helpers";

import ChangePassword from "components/change-password/ChangePassword";

// ==============================|| EDIT USER PAGE ||============================== //

export default function EditProfile() {
  const { validate, onSubmit, profile, loading, selectedRole } =
    useEditProfile();

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
          commission:
            profile.commissions !== null && profile.commissions.length > 0
              ? profile.commissions[0].toString()
              : "",
          secondaryCommission:
            selectedRole === UserRoles.Both &&
            profile.commissions !== null &&
            profile.commissions.length > 1
              ? profile.commissions[1].toString()
              : "",
          dailyWage:
            profile.daily_wage !== null ? profile.daily_wage.toString() : "",
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ handleSubmit, errors, touched, isSubmitting, values }) => (
          <Form onSubmit={handleSubmit}>
            <FormLayout
              isSubmitting={isSubmitting}
              showSubmitButton={false}
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
                        disabled
                        error={touched.fullName ? errors.fullName : ""}
                      />,
                      <FormInput
                        id={"email"}
                        name={"email"}
                        placeholder={"Username"}
                        label={"username"}
                        optional={false}
                        type={"text"}
                        disabled
                      />,
                      <FormInput
                        id={"role"}
                        name={"role"}
                        label={"role"}
                        optional={false}
                        disabled
                      />,
                      <FormInput
                        id={"commission"}
                        name={"commission"}
                        placeholder={"Sales Commission (%)"}
                        label={"sales-commission-percentage"}
                        type={"number"}
                        optional={false}
                        disabled
                      />,
                      <FormInput
                        id={"secondaryCommission"}
                        name={"secondaryCommission"}
                        placeholder={"Closing Commission (%)"}
                        label={"closing-commission-percentage"}
                        type={"number"}
                        optional={false}
                        disabled
                      />,
                      <FormInput
                        id={"dailyWage"}
                        name={"dailyWage"}
                        placeholder={"Daily Wage"}
                        label={"daily-wage"}
                        type={"number"}
                        disabled
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
                        disabled
                        error={touched.fullName ? errors.fullName : ""}
                      />,
                      <FormInput
                        id={"email"}
                        name={"email"}
                        placeholder={"Username"}
                        label={"username"}
                        optional={false}
                        type={"text"}
                        disabled
                      />,
                      <FormInput
                        id={"role"}
                        name={"role"}
                        label={"role"}
                        optional={false}
                        disabled
                      />,
                      <FormInput
                        id={"commission"}
                        name={"commission"}
                        placeholder={"Commission (%)"}
                        label={"commission-percentage"}
                        type={"number"}
                        optional={false}
                        disabled
                      />,
                      <FormInput
                        id={"dailyWage"}
                        name={"dailyWage"}
                        placeholder={"Daily Wage"}
                        label={"daily-wage"}
                        type={"number"}
                        disabled
                      />,
                    ]
              }
            />
          </Form>
        )}
      </Formik>
      <ChangePassword confirmCurrentPassword={true} />
    </>
  );
}
