import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import ProfilesRepository, {
} from "utils/repositories/profilesRepository";

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

  function validate(values: ValuesChangePassword) {
    const errors = {} as ValuesChangePassword;

    if (!values.currentPassword.trim()) {
      errors.currentPassword = "required";
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

  function validateWithoutConfirmation(values: ValuesChangePasswordWithoutConfirmation) {
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
      if (id) {

      }
    } catch (e) {
      
    }
  }

  async function onSubmitWithoutConfirmation(values: ValuesChangePasswordWithoutConfirmation) {
    try {
      if (id) {

      }
    } catch (e) {
      
    }
  }

  return { validate, onSubmit, validateWithoutConfirmation, onSubmitWithoutConfirmation };
}
