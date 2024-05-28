import { Box, CircularProgress } from "@mui/material";

interface LoaderProps {
  size?: string;
}

const CircularLoader = ({ size }: LoaderProps) => {
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginRight: "auto",
      }}
    >
      <CircularProgress size={size} color="primary" />
    </Box>
  );
};

export default CircularLoader;
