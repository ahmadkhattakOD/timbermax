// components/Dashboard/DashboardStats.tsx
import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  People,
  Inventory,
  Receipt,
  Description,
  AttachMoney,
  ShoppingCart,
} from "@mui/icons-material";
import { DashboardMetrics } from "./useDashboard";

interface DashboardStatsProps {
  metrics: DashboardMetrics | null;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ metrics }) => {
  console.log("METRICSSSS", metrics);

  const stats = [
    {
      title: "Total Sales",
      value: `$${metrics?.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`,
      icon: <AttachMoney />,
      color: "#4CAF50",
    },
    {
      title: "Total Invoices",
      value: metrics?.totalInvoices || 0,
      icon: <Receipt />,
      color: "#2196F3",
    },
    {
      title: "Total Quotations",
      value: metrics?.totalQuotations || 0,
      icon: <Description />,
      color: "#FF9800",
    },
    {
      title: "Total Customers",
      value: metrics?.totalCustomers || 0,
      icon: <People />,
      color: "#9C27B0",
    },
    {
      title: "Total Items",
      value: metrics?.stockMetrics?.totalItems || 0,
      icon: <Inventory />,
      color: "#607D8B",
    },
    {
      title: "Stock Value",
      value: `$${metrics?.stockMetrics?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`,
      icon: <ShoppingCart />,
      color: "#795548",
    },
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="body2"
                  >
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stat.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: `${stat.color}20`,
                    borderRadius: "50%",
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {React.cloneElement(stat.icon, {
                    sx: { color: stat.color, fontSize: 24 },
                  })}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </>
  );
};

export default DashboardStats;
