import { Box, SxProps } from "@mui/system";
import Avatar from "./@extended/Avatar";
import { ReactNode } from "react";

interface Props {
  url?: string;
  sx?: SxProps;
  avatarChild?: ReactNode
}

// ==============================|| PROFILE PICTURE ||============================== //

export default function ProfilePicture({ url, sx, avatarChild }: Props) {
  return (
    <Box sx={sx ?? { height: "64px", width: "64px" }}>
      <Avatar
        alt="Avatar"
        src={url}
        sx={{ height: "100%", width: "100%" }}
      >
        {avatarChild}
      </Avatar>
    </Box>
  );
}
