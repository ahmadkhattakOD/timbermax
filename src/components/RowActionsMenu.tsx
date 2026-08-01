import * as React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { MoreVertical } from "lucide-react";

export interface RowAction {
  label: string;
  icon: React.ReactNode;
  // Receives the trigger button so callers can anchor a follow-up menu to it —
  // the menu item itself is gone by the time the handler runs.
  onClick: (anchor: HTMLElement) => void;
  // MUI palette key used to tint the icon + label (e.g. "error.main").
  color?: string;
  disabled?: boolean;
  // Draws a separator above this item.
  divider?: boolean;
}

interface RowActionsMenuProps {
  actions: RowAction[];
  // Row-level busy flag: disables the trigger and shows a spinner in its place.
  loading?: boolean;
}

// Collapses a row's action buttons into a single overflow menu, so wide tables
// stay readable. Every click stops propagation — rows are clickable themselves.
export default function RowActionsMenu({
  actions,
  loading = false,
}: RowActionsMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const open = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const close = () => setAnchorEl(null);

  const run = (event: React.MouseEvent, action: RowAction) => {
    event.stopPropagation();
    setAnchorEl(null);
    // Anchor follow-up menus (print, status) to the trigger, which stays mounted.
    if (triggerRef.current) action.onClick(triggerRef.current);
  };

  if (!actions.length) return null;

  return (
    <>
      <Tooltip title="Actions">
        <span>
          <IconButton
            ref={triggerRef}
            size="small"
            onClick={open}
            disabled={loading}
            aria-label="row actions"
            aria-haspopup="true"
          >
            {loading ? (
              <CircularProgress size={18} thickness={5} />
            ) : (
              <MoreVertical size={18} />
            )}
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={close}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 210 } } }}
      >
        {actions.map((action, index) => [
          action.divider && index > 0 ? (
            <Divider key={`${action.label}-divider`} sx={{ my: 0.5 }} />
          ) : null,
          <MenuItem
            key={action.label}
            onClick={(e) => run(e, action)}
            disabled={action.disabled}
            sx={action.color ? { color: action.color } : undefined}
          >
            <ListItemIcon sx={action.color ? { color: action.color } : undefined}>
              {action.icon}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: "body2" }}>
              {action.label}
            </ListItemText>
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
}
