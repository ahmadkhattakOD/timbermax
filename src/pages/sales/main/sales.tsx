// material-ui
import Typography from "@mui/material/Typography";
import AnimateButton from "components/@extended/AnimateButton";
import ActionButton from "components/ActionButton";

// project-imports
import MainCard from "components/MainCard";
import { useSales } from "./useSales";
import { Box } from "@mui/material";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";

// ==============================|| SAMPLE PAGE ||============================== //

export default function Sales() {
  const { goToCreateSale } = useSales();

  return (
    <>
      <CreateAndFiltersLayout
        actionButton={
          <ActionButton text={"add-new-sale"} onClick={goToCreateSale} />
        }
      />
      <MainCard title="Sample Card">
        <Typography variant="body1">SALES LISt</Typography>
      </MainCard>
    </>
  );
}
