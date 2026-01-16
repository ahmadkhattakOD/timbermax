import { openSnackbar } from "api/snackbar";
import useAuth from "hooks/useAuth";
import { useEffect, useState } from "react";
import { SnackbarProps } from "types/snackbar";
import ProfilesRepository from "utils/repositories/profilesRepository";

export interface ValuesEditProfile {
  fullName: string;
  email: string;
  role: string;
}

export function useEditProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
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
          alert: { color: "success" },
        } as SnackbarProps);
        getProfile();
      } else {
        openSnackbar({
          open: true,
          message:
            "Profile could not be edited successfully. Please try again.",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Profile could not be edited successfully. Please try again.",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }
  }

  async function getProfile() {
    setLoading(true);
    const profilesRepository = new ProfilesRepository();
    const currentUser = await profilesRepository.getCurrentUser();
    if (currentUser) {
      const existingProfile = await profilesRepository.getSingle(currentUser.id);
      if (existingProfile?.profileData && !existingProfile.profileError) {
        setProfile(existingProfile.profileData);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getProfile();
  }, []);

  return { validate, onSubmit, profile, loading };
}
