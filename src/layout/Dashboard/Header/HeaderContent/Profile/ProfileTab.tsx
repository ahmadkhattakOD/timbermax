import { useState, MouseEvent } from "react";

// material-ui
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

// assets
import { Card, Edit2, Logout, Profile, Profile2User } from "iconsax-react";
import { useNavigate } from "react-router";

interface Props {
  handleLogout: () => void;
}

// ==============================|| HEADER PROFILE - PROFILE TAB ||============================== //

export default function ProfileTab({ handleLogout }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const handleListItemClick = (
    event: MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    setSelectedIndex(index);
  };

  const navigate = useNavigate();

  return (
    <List
      component="nav"
      sx={{ p: 0, "& .MuiListItemIcon-root": { minWidth: 32 } }}
    >
      <ListItemButton
        selected={selectedIndex === 0}
        onClick={(event: MouseEvent<HTMLDivElement>) =>
          handleListItemClick(event, 0)
        }
      >
        <ListItemIcon>
          <Edit2 variant="Bulk" size={18} />
        </ListItemIcon>
        <ListItemText
          primary="Edit Profile"
          onClick={() => {
            navigate("/profile");
          }}
        />
      </ListItemButton>
      <ListItemButton selected={selectedIndex === 2} onClick={handleLogout}>
        <ListItemIcon>
          <Logout variant="Bulk" size={18} />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItemButton>
    </List>
  );
}
