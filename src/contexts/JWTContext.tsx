import { createContext, useEffect, useReducer, ReactElement } from "react";

// reducer - state management
import { LOGIN, LOGOUT, UPDATE } from "store/reducers/actions";
import authReducer from "store/reducers/auth";

// project-imports
import { AuthProps, JWTContextType } from "types/auth";
import ProfilesRepository from "utils/repositories/profilesRepository";
import { Box } from "@mui/material";
import CircularLoader from "components/CircularLoader";

// constant
const initialState: AuthProps = {
  isLoggedIn: false,
  role: "",
  fullName: "",
  isInitialized: false,
};

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //

const JWTContext = createContext<JWTContextType | null>(null);

export const JWTProvider = ({ children }: { children: ReactElement }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const profilesRepository = new ProfilesRepository();
        const currentUser = await profilesRepository.getCurrentUser();
        if (currentUser) {
          const currentProfile = await profilesRepository.getSingle(
            currentUser.id
          );
          if (currentProfile) {
            const { profileData, profileError } = currentProfile;
            if (profileData && !profileError) {
              dispatch({
                type: LOGIN,
                payload: {
                  role: profileData.role,
                  fullName: profileData.full_name,
                  isLoggedIn: true,
                  isInitialized: true,
                },
              });
            } else {
              // Profile is missing/inactive (e.g. disabled since the last
              // session) — tear down the stale Supabase session too.
              await profilesRepository.logoutUser();
              dispatch({
                type: LOGOUT,
              });
            }
          } else {
            await profilesRepository.logoutUser();
            dispatch({
              type: LOGOUT,
            });
          }
        } else {
          dispatch({
            type: LOGOUT,
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: LOGOUT,
        });
      }
    };

    init();
  }, []);

  const login = async (email: string, password: string) => {
    const profilesRepository = new ProfilesRepository();
    let response;
    try {
      response = await profilesRepository.loginUser(email.trim(), password.trim());
    } catch (error) {
      console.error("Error logging user in:", error);
      return false;
    }

    if (!response) {
      return false;
    }

    // Look up the profile regardless of status so a disabled account can be
    // distinguished from "no such user" and given its own error message.
    const currentProfile = await profilesRepository.getSingle(response.id, false);
    const profileData = currentProfile?.profileData;
    const profileError = currentProfile?.profileError;

    if (!profileData || profileError) {
      return false;
    }

    if (profileData.status === "inactive") {
      // signInWithPassword already created a live session for this user —
      // tear it down so a disabled account can't stay signed in.
      await profilesRepository.logoutUser();
      throw new Error("Your account has been disabled. Please contact an administrator.");
    }

    dispatch({
      type: LOGIN,
      payload: {
        role: profileData.role,
        fullName: profileData.full_name,
        isLoggedIn: true,
        isInitialized: true,
      },
    });
    return true;
  };

  const logout = async () => {
    try {
      const profilesRepository = new ProfilesRepository();
      const response = await profilesRepository.logoutUser();
      if (response) {
        dispatch({ type: LOGOUT });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error logging user out:", error);
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    console.log("email - ", email);
  };

  const editProfile = async (fullName: string): Promise<boolean> => {
    try {
      const profilesRepository = new ProfilesRepository();
      const currentUser = await profilesRepository.getCurrentUser();
      if (currentUser) {
        const editedProfile = await profilesRepository.editFullName(
          currentUser.id,
          fullName.trim()
        );
        if (editedProfile) {
          dispatch({
            type: UPDATE,
            payload: {
              isLoggedIn: true,
              fullName: fullName,
              role: editedProfile.role,
              isInitialized: true
            },
          });
          return true;
        }
        return false;
      }
      return false;
    }
    catch (error) {
      console.error("Error editing user profile:", error);
      return false;
    }
  }

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return (
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
        }}
      >
        <CircularLoader />
      </Box>
    );
  }

  return (
    <JWTContext.Provider
      value={{
        ...state,
        login,
        logout,
        resetPassword,
        editProfile
      }}
    >
      {children}
    </JWTContext.Provider>
  );
};

export default JWTContext;
