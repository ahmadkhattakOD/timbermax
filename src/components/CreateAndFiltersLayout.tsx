// material-ui
import { styled } from "@mui/material/styles";
import LinearProgress, {
  LinearProgressProps,
} from "@mui/material/LinearProgress";
import { KeyedObject } from "types/root";
import { ReactElement } from "react";
import { Box, Grid } from "@mui/material";

// ==============================|| CREATE AND FILTERS LAYOUT ||============================== //

export interface CreateAndFiltersLayoutProps extends KeyedObject {
  actionButton?: ReactElement;
  filters?: ReactElement;
}

export default function CreateAndFiltersLayout({
  actionButton,
  filters,
}: CreateAndFiltersLayoutProps) {
  return (
    <Grid container sx={{width: '100%', paddingBottom: '2rem'}}>
      <Grid item xs={12} sm={6}>
        <Box
          sx={{
            width: "100%",
            display: 'flex',
            justifyContent: { xs: "center", sm: "start" },
            alignItems: "center",
          }}
        >
          {actionButton ?? <Box></Box>}
        </Box>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Box
          sx={{
            width: "100%",
            display: 'flex',
            justifyContent: { xs: "center", sm: "flex-end" },
            alignItems: "center",
            paddingTop: {xs: '1rem', sm: '0px'}
          }}
        >
          {filters ?? <Box></Box>}
        </Box>
      </Grid>
    </Grid>
  );
}
