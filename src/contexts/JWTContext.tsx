import { createContext, useEffect, useReducer, ReactElement } from "react";

// reducer - state management
import { LOGIN, LOGOUT } from "store/reducers/actions";
import authReducer from "store/reducers/auth";

// project-imports
import Loader from "components/Loader";
import { AuthProps, JWTContextType } from "types/auth";
import ProfilesRepository from "utils/repositories/profilesRepository";
import { Box } from "@mui/material";
import CircularLoader from "components/CircularLoader";

// constant
const initialState: AuthProps = {
  isLoggedIn: false,
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
          dispatch({
            type: LOGIN,
            payload: {
              isLoggedIn: true,
            },
          });
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
    try {
      const profilesRepository = new ProfilesRepository();
      const response = await profilesRepository.loginUser(
        email.trim(),
        password.trim()
      );
      if (response) {
        dispatch({
          type: LOGIN,
          payload: {
            isLoggedIn: true,
          },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.log("Error logging user in:", error);
      return false;
    }
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
      console.log("Error logging user out:", error);
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    console.log("email - ", email);
  };

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
      }}
    >
      {children}
    </JWTContext.Provider>
  );
};

export default JWTContext;
