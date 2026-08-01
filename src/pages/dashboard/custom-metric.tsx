import React from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
  Grid,
} from "@mui/material";
import { Person, TrendingUp, Star } from "@mui/icons-material";

interface CustomerMetric {
  id: number;
  name: string;
  totalSpent: number;
  invoiceCount: number;
}

interface CustomerMetricsProps {
  metrics?: {
    topCustomers: CustomerMetric[];
    newCustomers: number;
  };
}

const CustomerMetrics: React.FC<CustomerMetricsProps> = ({ metrics }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Calculate average spend safely
  const avgSpend =
    metrics?.topCustomers && metrics.topCustomers.length > 0
      ? metrics.topCustomers.reduce(
          (sum, customer) => sum + customer.totalSpent,
          0
        ) / metrics.topCustomers.length
      : 0;

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header Section */}
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        spacing={isMobile ? 1 : 0}
        sx={{ mb: 2 }}
      >
        <Typography
          variant={isMobile ? "subtitle1" : "h6"}
          gutterBottom={isMobile}
          sx={{ fontWeight: 600 }}
        >
          Customer Insights
        </Typography>
      </Stack>

      {/* Top Customers Section */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          color="textSecondary"
          gutterBottom
          sx={{ fontSize: isMobile ? "0.875rem" : "0.9rem" }}
        >
          Top Customers
        </Typography>
        <Box sx={{ maxHeight: isMobile ? 200 : 240, overflow: "auto" }}>
          <List dense disablePadding>
            {metrics?.topCustomers.map((customer, index) => (
              <ListItem
                key={customer.id}
                secondaryAction={
                  <Stack
                    direction="column"
                    alignItems="flex-end"
                    spacing={0.5}
                    sx={{ ml: 1 }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color="success.main"
                      sx={{
                        fontSize: isMobile ? "0.75rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      $
                      {customer.totalSpent.toLocaleString(undefined, {
                        minimumFractionDigits: isMobile ? 0 : 2,
                        maximumFractionDigits: isMobile ? 0 : 2,
                      })}
                      {isMobile && customer.totalSpent >= 1000 && "k"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ fontSize: isMobile ? "0.7rem" : "0.75rem" }}
                    >
                      {customer.invoiceCount} {isMobile ? "inv" : "invoices"}
                    </Typography>
                  </Stack>
                }
                sx={{
                  py: isMobile ? 0.75 : 1,
                  px: isMobile ? 0.5 : 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "&:last-child": {
                    borderBottom: "none",
                  },
                }}
              >
                <ListItemAvatar sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Avatar
                    sx={{
                      bgcolor: index < 3 ? "primary.main" : "grey.500",
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    }}
                  >
                    {index < 3 ? (
                      <Star sx={{ fontSize: isMobile ? "16px" : "20px" }} />
                    ) : (
                      <Person sx={{ fontSize: isMobile ? "16px" : "20px" }} />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{
                        fontSize: isMobile ? "0.875rem" : "0.9rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: isMobile ? 120 : 180,
                      }}
                    >
                      {customer.name}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ fontSize: isMobile ? "0.7rem" : "0.75rem" }}
                    >
                      #{customer.id}
                    </Typography>
                  }
                  sx={{ my: 0 }}
                />
              </ListItem>
            ))}
            {(!metrics?.topCustomers || metrics.topCustomers.length === 0) && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography
                      color="textSecondary"
                      align="center"
                      sx={{ py: 2 }}
                    >
                      No customer data available
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Stats Section - Responsive Grid */}
      <Grid container spacing={isMobile ? 1 : 2} justifyContent="space-around">
        <Grid item xs={4}>
          <Box sx={{ textAlign: "center", px: isMobile ? 0.5 : 1 }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              color="primary"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              {metrics?.topCustomers.length || 0}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{
                fontSize: isMobile ? "0.7rem" : "0.75rem",
                display: "block",
              }}
            >
              Active Customers
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={4}>
          <Box sx={{ textAlign: "center", px: isMobile ? 0.5 : 1 }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              color="success"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              {metrics?.newCustomers || 0}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{
                fontSize: isMobile ? "0.7rem" : "0.75rem",
                display: "block",
              }}
            >
              New This Period
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={4}>
          <Box sx={{ textAlign: "center", px: isMobile ? 0.5 : 1 }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              color="warning"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              {avgSpend.toLocaleString(undefined, {
                minimumFractionDigits: isMobile ? 0 : 2,
                maximumFractionDigits: isMobile ? 0 : 2,
              })}
              {isMobile && avgSpend >= 1000 && "k"}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{
                fontSize: isMobile ? "0.7rem" : "0.75rem",
                display: "block",
              }}
            >
              Avg. Spend
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Mobile Hint */}
      {isMobile && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ fontSize: "0.7rem" }}
          >
            Scroll to see more customers ↑
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CustomerMetrics;
