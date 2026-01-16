import { RouterProvider } from "react-router-dom";

// project import
import router from "routes";
import ThemeCustomization from "themes";

import Locales from "components/Locales";
// import RTLLayout from 'components/RTLLayout';
import ScrollTop from "components/ScrollTop";
import Snackbar from "components/@extended/Snackbar";

// auth-provider
import { JWTProvider as AuthProvider } from "contexts/JWTContext";

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      {/* <RTLLayout> */}
      <AuthProvider>
        <Locales>
          <ScrollTop>
            <>
              <RouterProvider router={router} />
              <Snackbar />
            </>
          </ScrollTop>
        </Locales>
      </AuthProvider>
      {/* </RTLLayout> */}
    </ThemeCustomization>
  );
}
