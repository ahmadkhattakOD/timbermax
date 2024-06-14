// project-imports
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useChangePassword } from "./useChangePassword";
import CircularLoader from "components/CircularLoader";
import { userRoles } from "utils/helpers";
import { ArrowCircleRight2, Warning2 } from "iconsax-react";
import { KeyedObject } from "types/root";

interface ChangePasswordProps extends KeyedObject {
  confirmCurrentPassword: boolean;
}

export default function ChangePassword({
  confirmCurrentPassword = true,
}: ChangePasswordProps) {
  const {
    validate,
    validateWithoutConfirmation,
    onSubmit,
    onSubmitWithoutConfirmation,
  } = useChangePassword();

  const theme = useTheme();

  return (
    <Accordion
      sx={{
        paddingBottom: "2rem",
        paddingTop: "4rem",
        backgroundColor: "transparent",
        border: "none",
      }}
      defaultExpanded={false}
    >
      <AccordionSummary
        expandIcon={<ArrowCircleRight2 variant="Linear" size={22} />}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Typography variant="h5">Change Password</Typography>
          <Warning2
            variant="Linear"
            size={16}
            color={theme.palette.warning.main}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            width: "100%",
          }}
        >
          {confirmCurrentPassword ? (
            <Formik
              enableReinitialize
              initialValues={{
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
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
                        id={"currentPassword"}
                        name={"currentPassword"}
                        placeholder={"Current Password"}
                        label={"current-password"}
                        optional={false}
                        type={"text"}
                        error={
                          touched.currentPassword ? errors.currentPassword : ""
                        }
                      />,
                      <FormInput
                        id={"newPassword"}
                        name={"newPassword"}
                        placeholder={"New Password"}
                        label={"new-password"}
                        optional={false}
                        type={"text"}
                        error={touched.newPassword ? errors.newPassword : ""}
                      />,
                      <FormInput
                        id={"confirmPassword"}
                        name={"confirmPassword"}
                        placeholder={"Confirm New Password"}
                        label={"confirm-new-password"}
                        optional={false}
                        type={"text"}
                        error={
                          touched.confirmPassword ? errors.confirmPassword : ""
                        }
                      />,
                    ]}
                  />
                </Form>
              )}
            </Formik>
          ) : (
            <Formik
              enableReinitialize
              initialValues={{
                newPassword: "",
                confirmPassword: "",
              }}
              validate={validateWithoutConfirmation}
              onSubmit={onSubmitWithoutConfirmation}
            >
              {({ handleSubmit, errors, touched, isSubmitting, values }) => (
                <Form onSubmit={handleSubmit}>
                  <FormLayout
                    isSubmitting={isSubmitting}
                    submitButtonText={"submit"}
                    inputs={[
                      <FormInput
                        id={"newPassword"}
                        name={"newPassword"}
                        placeholder={"New Password"}
                        label={"new-password"}
                        optional={false}
                        type={"text"}
                        error={touched.newPassword ? errors.newPassword : ""}
                      />,
                      <FormInput
                        id={"confirmPassword"}
                        name={"confirmPassword"}
                        placeholder={"Confirm New Password"}
                        label={"confirm-new-password"}
                        optional={false}
                        type={"text"}
                        error={
                          touched.confirmPassword ? errors.confirmPassword : ""
                        }
                      />,
                    ]}
                  />
                </Form>
              )}
            </Formik>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
