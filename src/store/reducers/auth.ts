// action - state management
import { LOGIN, LOGOUT, UPDATE } from "./actions";

// types
import { AuthProps, AuthActionProps } from "types/auth";

// initial state
export const initialState: AuthProps = {
  isLoggedIn: false,
  role: "",
  fullName: "",
  isInitialized: undefined
};

// ==============================|| AUTH REDUCER ||============================== //

const auth = (state = initialState, action: AuthActionProps) => {
  switch (action.type) {
    case LOGIN: {
      const { role, isInitialized, fullName } = action.payload!;
      return {
        isLoggedIn: true,
        role: role,
        fullName: fullName,
        isInitialized: isInitialized
      };
    }
    case UPDATE: {
      const { fullName } = action.payload!;
      return {
        ...state,
        fullName: fullName,
      };
    }
    case LOGOUT: {
      return {
        isLoggedIn: false,
        role: "",
        fullName: "",
        isInitialized: undefined
      };
    }
    default: {
      return { ...state };
    }
  }
};

export default auth;
