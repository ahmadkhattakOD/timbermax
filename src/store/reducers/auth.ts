// action - state management
import { REGISTER, LOGIN, LOGOUT } from "./actions";

// types
import { AuthProps, AuthActionProps } from "types/auth";

// initial state
export const initialState: AuthProps = {
  isLoggedIn: false,
};

// ==============================|| AUTH REDUCER ||============================== //

const auth = (state = initialState, action: AuthActionProps) => {
  switch (action.type) {
    case LOGIN: {
      const { user } = action.payload!;
      return {
        isLoggedIn: true,
      };
    }
    case LOGOUT: {
      return {
        isLoggedIn: false,
      };
    }
    default: {
      return { ...state };
    }
  }
};

export default auth;
