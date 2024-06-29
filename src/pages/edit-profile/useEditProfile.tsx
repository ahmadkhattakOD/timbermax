import { openSnackbar } from "api/snackbar";
import useAuth from "hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import ProfilesRepository from "utils/repositories/profilesRepository";

export interface ValuesEditProfile {
  fullName: string;
  email: string;
  role: string;
  commission: string;
  secondaryCommission: string;
  dailyWage: string;
}

export function useEditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { editProfile } = useAuth();

  function validate(values: ValuesEditProfile) {
    const errors = {} as ValuesEditProfile;

    if (!values.fullName.trim()) {
      errors.fullName = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditProfile) {
    try {
      const editedProfile = await editProfile(values.fullName);
      if (editedProfile) {
        openSnackbar({
          open: true,
          message: "Profile edited successfully.",
          variant: "alert",
          alert: {
            color: "success",
          },
        } as SnackbarProps);
        getProfile();
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
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Profile could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
  }

  async function getProfile() {
    setLoading(true);
    const profilesRepository = new ProfilesRepository();
    const currentUser = await profilesRepository.getCurrentUser();
    if (currentUser) {
      const profilesRepository = new ProfilesRepository();
      const existingProfile = await profilesRepository.getSingle(
        currentUser.id
      );
      if (existingProfile) {
        const { profileData, profileError } = existingProfile;
        if (profileData && !profileError) {
          setProfile(profileData);
          setSelectedRole(profileData.role);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getProfile();
  }, []);

  return { validate, onSubmit, profile, loading, selectedRole };
}
