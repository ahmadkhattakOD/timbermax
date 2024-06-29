import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import ProfilesRepository, {
  ProfileSupabase,
} from "utils/repositories/profilesRepository";

export interface ValuesEditProfile {
  fullName: string;
  email: string;
  role: string;
  commission: string;
  dailyWage: string;
}

export function useEditUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const { id } = useParams();

  function validate(values: ValuesEditProfile) {
    const errors = {} as ValuesEditProfile;

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

    if (!values.role.trim()) {
      errors.role = "required";
    }

    if (values.commission === "" || parseFloat(values.commission) < 0) {
      errors.commission = "required-valid-number-positive";
    }

    if (values.dailyWage !== "" && parseFloat(values.dailyWage) < 0) {
      errors.dailyWage = "required-valid-number-positive";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditProfile) {
    try {
      if (id) {
        const updatedProfile: ProfileSupabase = {
          full_name: values.fullName,
          email: profile.email,
          profile_picture: "",
          role: values.role,
          daily_wage: parseFloat(values.dailyWage),
          commission: parseFloat(values.commission),
        };

        const profilesRepository = new ProfilesRepository();
        const editedProfile = await profilesRepository.edit(id, updatedProfile);

        if (editedProfile) {
          openSnackbar({
            open: true,
            message: "Profile edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Profile could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }
        navigate("/users");
      } else {
        openSnackbar({
          open: true,
          message:
            "Profile could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
        navigate("/users");
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Profile could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate("/profiles");
    }
  }

  async function getProfile() {
    setLoading(true);
    if (id) {
      const profilesRepository = new ProfilesRepository();
      const existingProfile = await profilesRepository.getSingle(id);
      if (existingProfile) {
        const { profileData, profileError } = existingProfile;
        if (profileData && !profileError) {
          setProfile(profileData);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getProfile();
  }, []);

  return { validate, onSubmit, profile, loading };
}
