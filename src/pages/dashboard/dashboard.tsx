// project-imports
import MainCard from "components/MainCard";
import Chart from "react-apexcharts";
import { useDashboard } from "./useDashboard";
import { Grid } from "@mui/material";

// ==============================|| DASHBOARD PAGE ||============================== //

export default function Dashboard() {
  const { options, series, userOptions, userSeries } = useDashboard();

  return (
    <Grid container columnSpacing={"1rem"} rowSpacing={"1rem"}>
      <Grid item xs={12} md={6}>
        <MainCard title="Total Sales">
          <Chart options={options} series={series} type="bar" />
        </MainCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <MainCard title="Total Commission">
          <Chart options={options} series={series} type="bar" />
        </MainCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <MainCard title="Users">
          <Chart options={userOptions} series={userSeries} type="donut" />
        </MainCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <MainCard title="Upcoming Shows">

        </MainCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <MainCard title="Low in Stock">
          
        </MainCard>
      </Grid>
    </Grid>
  );
}
