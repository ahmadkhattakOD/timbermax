import { ReactElement } from 'react';

// ==============================|| TYPES - AUTH  ||============================== //

export type GuardProps = {
  children: ReactElement | null;
};

export type UserProfile = {
  id?: string;
  email?: string;
  avatar?: string;
  image?: string;
  name?: string;
  role?: string;
  tier?: string;
};

export interface AuthProps {
  isLoggedIn: boolean;
  role: string;
  fullName: string;
  isInitialized: boolean | undefined;
}

export interface AuthActionProps {
  type: string;
  payload?: AuthProps;
}

export interface InitialLoginContextProps {
  isLoggedIn: boolean;
  isInitialized?: boolean;
  user?: UserProfile | null | undefined;
}

export interface JWTDataProps {
  userId: string;
}

export type JWTContextType = {
  isLoggedIn: boolean;
  fullName: string;
  role: string;
  logout: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  editProfile: (fullName: string) => Promise<boolean>;
};
