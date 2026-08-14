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
}

export function useEditUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [actionConfirmModalOpen, setActionConfirmModalOpen] = useState(false);
  const { id } = useParams();

  const isDisabled = profile?.status === "inactive";

  function openActionConfirmModal() {
    setActionConfirmModalOpen(true);
  }

  function closeActionConfirmModal() {
    setActionConfirmModalOpen(false);
  }

  async function onConfirmToggleStatus() {
    if (!id) return;

    const profilesRepository = new ProfilesRepository();
    const wasDisabled = isDisabled;
    const affectedCount = wasDisabled
      ? await profilesRepository.enable([id])
      : await profilesRepository.disable([id]);

    if (affectedCount > 0) {
      setProfile((prev: any) => ({
        ...prev,
        status: wasDisabled ? "active" : "inactive",
      }));
      openSnackbar({
        open: true,
        message: `User ${wasDisabled ? "enabled" : "disabled"} successfully.`,
        variant: "alert",
        alert: { color: "success" },
      } as SnackbarProps);
    } else {
      openSnackbar({
        open: true,
        message: `User could not be ${wasDisabled ? "enabled" : "disabled"}. Please try again.`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }
  }

  async function onSubmit(values: ValuesEditProfile) {
    try {
      if (!id) {
        throw new Error("Missing user id");
      }

      const updatedProfile: ProfileSupabase = {
        full_name: values.fullName,
        email: profile.email, // keep original email
        profile_picture: "",
        role: values.role,
      };

      const profilesRepository = new ProfilesRepository();
      const editedProfile = await profilesRepository.edit(id, updatedProfile);

      openSnackbar({
        open: true,
        message: editedProfile
          ? "Profile edited successfully."
          : "Profile could not be edited successfully. Please try again.",
        variant: "alert",
        alert: { color: editedProfile ? "success" : "error" },
      } as SnackbarProps);

      navigate("/users");
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Profile could not be edited successfully. Please try again.",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);

      navigate("/users");
    }
  }

  async function getProfile() {
    setLoading(true);
    if (id) {
      const profilesRepository = new ProfilesRepository();
      const existingProfile = await profilesRepository.getSingle(id, false);

      if (existingProfile?.profileData && !existingProfile.profileError) {
        setProfile(existingProfile.profileData);
      }
    }
    setLoading(false);
  }

  function validate(values: ValuesEditProfile) {
    const errors = {} as ValuesEditProfile;

    if (!values.fullName.trim()) {
      errors.fullName = "required";
    }

    if (
      !values.email.trim() ||
      values.email.trim().length < 3 ||
      isNumeric(values.email[0])
    ) {
      errors.email = "required-username";
    }

    if (!values.role.trim()) {
      errors.role = "required";
    }

    return errors;
  }

  useEffect(() => {
    getProfile();
  }, []);

  return {
    validate,
    onSubmit,
    profile,
    loading,
    isDisabled,
    actionConfirmModalOpen,
    openActionConfirmModal,
    closeActionConfirmModal,
    onConfirmToggleStatus,
  };
}
