import { forwardRef, Ref } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";

// project-imports
import useConfig from "hooks/useConfig";

// types
import { KeyedObject } from "types/root";
import { Button } from "@mui/material";
import { FormattedMessage } from "react-intl";

export interface ActionButtonProps extends KeyedObject {
  text: string;
  onClick?: () => void;
  type?: "button" | "reset" | "submit" | undefined;
  disabled?: boolean;
}

// ==============================|| ACTION BUTTON ||============================== //

function ActionButton(
  { text, onClick, type, disabled = false }: ActionButtonProps,
  ref: Ref<HTMLDivElement>
) {
  return (
    <Button
      onClick={disabled ? undefined : onClick}
      variant={disabled ? "outlined" : "contained"}
      color="primary"
      sx={{
        maxWidth: { xs: "auto", sm: "250px" },
        width: "100%",
      }}
      type={type}
    >
      <FormattedMessage id={text} />
    </Button>
  );
}

export default forwardRef(ActionButton);
