import { openSnackbar } from "api/snackbar";
import useAuth from "hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import ProfilesRepository from "utils/repositories/profilesRepository";

export interface ValuesChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ValuesChangePasswordWithoutConfirmation {
  newPassword: string;
  confirmPassword: string;
}

export function useChangePassword() {
  const { id } = useParams();
  const { logout } = useAuth();
  const [currentPasswordObscured, setCurrentPasswordObscured] = useState(true);
  const [newPasswordObscured, setNewPasswordObscured] = useState(true);
  const [confirmPasswordObscured, setConfirmPasswordObscured] = useState(true);

  function validate(values: ValuesChangePassword) {
    const errors = {} as ValuesChangePassword;

    if (!values.currentPassword.trim()) {
      errors.currentPassword = "required";
    }

    if (
      values.currentPassword.trim().length > 0 &&
      values.newPassword.trim().length > 0 &&
      values.currentPassword === values.newPassword
    ) {
      errors.newPassword = "required-password-different";
    }

    const passwordRegex = new RegExp(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:<>?]).{8,}$/
    );
    if (!passwordRegex.test(values.newPassword.trim())) {
      errors.newPassword = "required-password";
    }

    if (values.confirmPassword.trim() !== values.newPassword.trim()) {
      errors.confirmPassword = "required-password-match";
    }

    return errors;
  }

  function validateWithoutConfirmation(
    values: ValuesChangePasswordWithoutConfirmation
  ) {
    const errors = {} as ValuesChangePassword;

    const passwordRegex = new RegExp(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:<>?]).{8,}$/
    );
    if (!passwordRegex.test(values.newPassword.trim())) {
      errors.newPassword = "required-password";
    }

    if (values.confirmPassword.trim() !== values.newPassword.trim()) {
      errors.confirmPassword = "required-password-match";
    }

    return errors;
  }

  async function onSubmit(values: ValuesChangePassword) {
    try {
      const profilesRepository = new ProfilesRepository();
      const currentUser = await profilesRepository.getCurrentUser();
      if (currentUser && currentUser.email) {
        const response = await profilesRepository.resetPassword(
          currentUser.email,
          values.currentPassword,
          values.confirmPassword
        );

        if (response) {
          openSnackbar({
            open: true,
            message:
              "Password has been reset successfully. Please re-login to continue.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
          await logout();
        } else {
          openSnackbar({
            open: true,
            message:
              "Password could not be reset successfully. Please recheck the entered credentials and try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Password could not be reset successfully. Please recheck the entered credentials and try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
  }

  async function onSubmitWithoutConfirmation(
    values: ValuesChangePasswordWithoutConfirmation
  ) {
    try {
      if (id) {
        const profilesRepository = new ProfilesRepository();
        const response = await profilesRepository.setPassword(
          id,
          values.newPassword
        );
        if (response) {
          openSnackbar({
            open: true,
            message: "Password has been set successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Password could not be set successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Password could not be set successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
  }

  function changeCurrentPasswordVisibility() {
    setCurrentPasswordObscured(!currentPasswordObscured);
  }

  function changeNewPasswordVisibility() {
    setNewPasswordObscured(!newPasswordObscured);
  }

  function changeConfirmPasswordVisibility() {
    setConfirmPasswordObscured(!confirmPasswordObscured);
  }

  return {
    validate,
    onSubmit,
    validateWithoutConfirmation,
    onSubmitWithoutConfirmation,
    currentPasswordObscured,
    changeCurrentPasswordVisibility,
    newPasswordObscured,
    changeNewPasswordVisibility,
    confirmPasswordObscured,
    changeConfirmPasswordVisibility,
  };
}
