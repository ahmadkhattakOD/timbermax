import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// project-imports
import useAuth from "hooks/useAuth";

// types
import { GuardProps } from "types/auth";
import { UserRoles, isRouteAllowed } from "utils/helpers";
import { Box } from "@mui/material";
import Error404 from "pages/maintenance/error/404";

// ==============================|| AUTH GUARD ||============================== //

export default function AuthGuard({ children }: GuardProps) {
  const { isLoggedIn, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("login", {
        state: {
          from: location.pathname,
        },
        replace: true,
      });
    }
  }, [isLoggedIn, navigate, location]);
//TODO: fix if need
console.log("ROLEEEE",role)
  if (isRouteAllowed(role as any)) {
    return children;
}
  return <Error404 />;
}
