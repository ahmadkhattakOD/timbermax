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
  color?: "primary" | "inherit" | "secondary" | "success" | "error" | "info" | "warning";
  minWidth?: string;
}

// ==============================|| ACTION BUTTON ||============================== //

function ActionButton(
  { text, onClick, type, disabled = false, color = "primary", minWidth }: ActionButtonProps,
  ref: Ref<HTMLDivElement>
) {
  return (
    <Button
      onClick={disabled ? undefined : onClick}
      variant={disabled ? "outlined" : "contained"}
      color={color}
      sx={{
        maxWidth: { xs: "auto", sm: "250px" },
        minWidth: minWidth,
        width: "100%",
      }}
      type={type}
    >
      <FormattedMessage id={text} />
    </Button>
  );
}

export default forwardRef(ActionButton);
