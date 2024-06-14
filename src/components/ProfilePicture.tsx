import { Box, SxProps } from "@mui/system";
import avatar1 from "assets/images/users/avatar-1.png";
import Avatar from "./@extended/Avatar";

interface Props {
  url?: string;
  sx?: SxProps;
}

// ==============================|| PROFILE PICTURE ||============================== //

export default function ProfilePicture({ url, sx }: Props) {
  return (
    <Box sx={sx ?? { height: "64px", width: "64px" }}>
      <Avatar
        alt="Avatar"
        src={url ?? avatar1}
        sx={{ height: "100%", width: "100%" }}
      />
    </Box>
  );
}
