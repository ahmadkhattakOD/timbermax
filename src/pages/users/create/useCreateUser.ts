import { openSnackbar } from "api/snackbar";
import { useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { UserRoles, formEmail, isNumeric } from "utils/helpers";
import ProfilesRepository, {
  ProfileSupabase,
  UserSupabase,
} from "utils/repositories/profilesRepository";

export interface ValuesCreateUser {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export function useCreateUser() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>("");

  function validate(values: ValuesCreateUser) {
    const errors = {} as ValuesCreateUser;

    if (!values.fullName.trim()) {
      errors.fullName = "required";
    }

    // const emailRegex = new RegExp(
    //   /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/
    // );
    // if (!emailRegex.test(values.email.trim())) {
    //   errors.email = "required-email";
    // }

    if (
      !values.email.trim() ||
      values.email.trim().length < 3 ||
      (values.email.length > 0 && isNumeric(values.email[0]))
    ) {
      errors.email = "required-username";
    }

    const passwordRegex = new RegExp(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:<>?]).{8,}$/
    );
    if (!passwordRegex.test(values.password.trim())) {
      errors.password = "required-password";
    }

    if (values.confirmPassword.trim() !== values.password.trim()) {
      errors.confirmPassword = "required-password-match";
    }

    if (!selectedRole.trim()) {
      errors.role = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateUser) {
    try {
      const newUser: UserSupabase = {
        email: formEmail(values.email.trim()),
        password: values.password.trim(),
      };

      const newProfile: ProfileSupabase = {
        full_name: values.fullName,
        email: values.email,
        profile_picture: "",
        role: selectedRole,
      };

      const profilesRepository = new ProfilesRepository();
      const createdUser = await profilesRepository.create(newUser, newProfile);

      if (createdUser) {
        openSnackbar({
          open: true,
          message: "User added successfully.",
          variant: "alert",
          alert: {
            color: "success",
          },
        } as SnackbarProps);
        navigate("/users");
      } else {
        openSnackbar({
          open: true,
          message:
            "User could not be added successfully. Please check the console for details.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
        navigate("/users");
      }
    } catch (e: any) {
      const errorMessage =
        e?.message || "User could not be added successfully. Please try again.";
      console.error("User creation error:", e);
      openSnackbar({
        open: true,
        message: errorMessage,
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      navigate("/users");
    }
  }
  return {
    validate,
    onSubmit,
    selectedRole,
    setSelectedRole,
  };
}
