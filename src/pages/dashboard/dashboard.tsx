// project-imports
import MainCard from "components/MainCard";
import Chart from "react-apexcharts";
import { useDashboard } from "./useDashboard";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useTheme,
} from "@mui/material";
import CircularLoader from "components/CircularLoader";
import { UserRoles, getDateFormatted } from "utils/helpers";

// ==============================|| DASHBOARD PAGE ||============================== //

export default function Dashboard() {
  const {
    loadingSales,
    salesOptions,
    salesSeries,
    salesYear,
    loadingCommissions,
    commissionOptions,
    commissionSeries,
    commissionYear,
    userOptions,
    userSeries,
    upcomingShows,
    viewAllShows,
    viewAllUsers,
    viewAllStock,
    viewShow,
    viewStock,
    viewAllInvoices,
    yearOptions,
    handleSalesYearChange,
    handleCommissionYearChange,
    lowInStock,
    loadingUsers,
    loadingUpcomingShows,
    loadingLowInStock,
    role,
    pendingCommission,
    loadingPendingCommission,
  } = useDashboard();
  const theme = useTheme();

  return (
    <Grid container columnSpacing={"1rem"} rowSpacing={"1rem"}>
      <Grid item xs={12} md={6}>
        <MainCard
          title="Total Sales"
          secondary={
            <Box sx={{ width: "100px" }}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={salesYear}
                  label="Year"
                  onChange={(e) => {
                    handleSalesYearChange(e.target.value as number);
                  }}
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          }
        >
          {loadingSales ? (
            <Box sx={{ padding: "3rem" }}>
              <CircularLoader />
            </Box>
          ) : (
            <Chart options={salesOptions} series={salesSeries} type="bar" />
          )}
        </MainCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <MainCard
          title="Total Commission"
          secondary={
            <Box sx={{ width: "100px" }}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={commissionYear}
                  label="Year"
                  onChange={(e) => {
                    handleCommissionYearChange(e.target.value as number);
                  }}
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          }
        >
          {loadingCommissions ? (
            <Box sx={{ padding: "3rem" }}>
              <CircularLoader />
            </Box>
          ) : (
            <Chart
              options={commissionOptions}
              series={commissionSeries}
              type="bar"
            />
          )}
        </MainCard>
      </Grid>
      {role !== UserRoles.Admin && (
        <Grid item xs={12} md={4}>
          <MainCard
            title="Pending Commission"
            secondary={<Button onClick={viewAllInvoices}>View Invoices</Button>}
          >
            {loadingPendingCommission ? (
              <Box sx={{ padding: "3rem" }}>
                <CircularLoader />
              </Box>
            ) : pendingCommission > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "2rem",
                }}
              >
                <Typography>
                  Pending commission, awaiting admin approval and payment.
                </Typography>
                <Typography variant="h5" sx={{ textAlign: "center" }}>
                  {pendingCommission.toFixed(2)} (A$)
                </Typography>
              </Box>
            ) : pendingCommission < 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "2rem",
                }}
              >
                <Typography>
                  Negative commission balance which would be re-adjusted.
                </Typography>
                <Typography variant="h5" sx={{ textAlign: "center" }}>
                  {Math.abs(pendingCommission).toFixed(2)} (A$)
                </Typography>
              </Box>
            ) : (
              <Box>All your commission has been paid out.</Box>
            )}
          </MainCard>
        </Grid>
      )}
      {role === UserRoles.Admin && (
        <Grid item xs={12} md={4}>
          <MainCard
            title="Users"
            secondary={<Button onClick={viewAllUsers}>View All</Button>}
          >
            {loadingUsers ? (
              <Box sx={{ padding: "3rem" }}>
                <CircularLoader />
              </Box>
            ) : userSeries.length > 0 ? (
              <Chart options={userOptions} series={userSeries} type="donut" />
            ) : (
              <Typography>No Users Found.</Typography>
            )}
          </MainCard>
        </Grid>
      )}
      {role === UserRoles.Admin && (
        <Grid item xs={12} md={4}>
          <MainCard
            title="Upcoming Shows"
            secondary={<Button onClick={viewAllShows}>View All</Button>}
          >
            {loadingUpcomingShows ? (
              <Box sx={{ padding: "3rem" }}>
                <CircularLoader />
              </Box>
            ) : upcomingShows.length > 0 ? (
              upcomingShows.map((show, idx) => {
                return (
                  <Box key={idx}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.25rem",
                        "&:hover": {
                          backgroundColor: theme.palette.secondary[100],
                          cursor: "pointer",
                        },
                      }}
                      onClick={() => {
                        viewShow(show.id);
                      }}
                    >
                      <Typography sx={{ color: theme.palette.text.primary }}>
                        {show.name}{" "}
                        {show.suburb || show.state
                          ? show.suburb
                            ? `(${show.suburb}${show.state && `, ${show.state}`})`
                            : `(${show.state})`
                          : ""}
                      </Typography>
                      <Typography
                        sx={{
                          color: theme.palette.text.secondary,
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getDateFormatted(show.start_date)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography>No Upcoming Shows Found.</Typography>
            )}
          </MainCard>
        </Grid>
      )}
      {role === UserRoles.Admin && (
        <Grid item xs={12} md={4}>
          <MainCard
            title="Low in Stock"
            secondary={<Button onClick={viewAllStock}>View All</Button>}
          >
            {loadingLowInStock ? (
              <Box sx={{ padding: "3rem" }}>
                <CircularLoader />
              </Box>
            ) : lowInStock.length > 0 ? (
              lowInStock.map((stock, idx) => {
                return (
                  <Box key={idx}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.25rem",
                        "&:hover": {
                          backgroundColor: theme.palette.secondary[100],
                          cursor: "pointer",
                        },
                      }}
                      onClick={() => {
                        viewStock(stock.id);
                      }}
                    >
                      <Typography sx={{ color: theme.palette.text.primary }}>
                        {stock.item?.name}
                      </Typography>
                      <Typography sx={{ color: theme.palette.text.secondary }}>
                        {stock.quantity}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography>No Stock Found.</Typography>
            )}
          </MainCard>
        </Grid>
      )}
    </Grid>
  );
}
