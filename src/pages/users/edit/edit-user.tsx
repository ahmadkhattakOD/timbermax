import { Box, Chip } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditUser } from "./useEditUser";
import CircularLoader from "components/CircularLoader";
import { stripEmail, userRoles } from "utils/helpers";
import ChangePassword from "components/change-password/ChangePassword";
import ActionButton from "components/ActionButton";
import ModalConfirmAction from "components/ModalConfirmAction";
import { FormattedMessage } from "react-intl";

export default function EditUser() {
  const {
    validate,
    onSubmit,
    profile,
    loading,
    isDisabled,
    actionConfirmModalOpen,
    openActionConfirmModal,
    closeActionConfirmModal,
    onConfirmToggleStatus,
  } = useEditUser();

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "1rem",
          mb: "1rem",
        }}
      >
        {isDisabled && (
          <Chip label={<FormattedMessage id="disabled" />} color="error" size="small" />
        )}
        <ActionButton
          text={isDisabled ? "enable" : "disable"}
          color={isDisabled ? "success" : "error"}
          onClick={openActionConfirmModal}
        />
      </Box>

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
              submitButtonText="submit"
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
                  error={touched.email ? errors.email : ""}
                />,
                <FormDropdown
                  id="role"
                  name="role"
                  label="role"
                  useFormattedStrings={false}
                  optional={false}
                  options={userRoles}
                  error={touched.role ? errors.role : ""}
                />,
              ]}
            />
          </Form>
        )}
      </Formik>

      <ChangePassword confirmCurrentPassword={false} />

      <ModalConfirmAction
        open={actionConfirmModalOpen}
        onClose={closeActionConfirmModal}
        onConfirm={onConfirmToggleStatus}
        titleId={isDisabled ? "enable-confirmation" : "disable-confirmation"}
        detailId={isDisabled ? "enable-confirmation-detail" : "disable-confirmation-detail"}
        confirmTextId={isDisabled ? "enable" : "disable"}
        confirmColor={isDisabled ? "success" : "error"}
      />
    </>
  );
}
