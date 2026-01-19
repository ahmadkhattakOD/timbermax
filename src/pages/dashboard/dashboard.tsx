import React, { useState } from "react";
import { Grid, Paper, Typography, Box, Button, Stack } from "@mui/material";
import { Download, Refresh } from "@mui/icons-material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DashboardFilters from "./dashboardFilters";
import DashboardStats from "./dashboardStats";
import TopSellingItems from "./TopSellingItem";
import StockMovementTable from "./stock-outs";
import LowStockAlert from "./low-stock-alert";
import CustomerMetrics from "./custom-metric";
import MonthlySalesChart from "./monthyl-sales-chart";
import useDashboard from "./useDashboard";

const Dashboard: React.FC = () => {
  const {
    metrics,
    timeSeriesData,
    stockMovements,
    filters,
    loading,
    error,
    updateFilters,
    fetchDashboardData,
    exportMonthlyReport,
  } = useDashboard();

  const [exporting, setExporting] = useState(false);

  if (loading && !metrics) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={fetchDashboardData} variant="contained" sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<Refresh />}
              onClick={fetchDashboardData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        <DashboardFilters filters={filters} onFilterChange={updateFilters} />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <DashboardStats metrics={metrics} />
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Monthly Sales Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: "400px" }}>
            <Typography variant="h6" gutterBottom>
              Sales Overview
            </Typography>
            <MonthlySalesChart data={metrics?.monthlySales || []} />
          </Paper>
        </Grid>

        {/* Stock Metrics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "400px" }}>
            <Typography variant="h6" gutterBottom>
              Stock Status
            </Typography>

            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "In Stock",
                        value: metrics?.stockMetrics.inStock || 0,
                      },
                      {
                        name: "Low Stock",
                        value: metrics?.stockMetrics.lowStock || 0,
                      },
                      {
                        name: "Out of Stock",
                        value: metrics?.stockMetrics.outOfStock || 0,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) =>
                      percent && percent > 0.05
                        ? `${name}: ${(percent * 100).toFixed(0)}%`
                        : ""
                    }
                  >
                    <Cell fill="#4CAF50" />
                    <Cell fill="#FF9800" />
                    <Cell fill="#F44336" />
                  </Pie>

                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Weekly Trends */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "350px" }}>
            <Typography variant="h6" gutterBottom>
              Weekly Trends
            </Typography>
            <ResponsiveContainer
              width="100%"
              height="100%"
              style={{ paddingBottom: "20px" }}
            >
              <BarChart data={metrics?.weeklyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" name="Sales ($)" />
                <Bar dataKey="invoices" fill="#82ca9d" name="Invoices" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Customer Metrics */}
        <Grid item xs={12} md={6}>
          <CustomerMetrics metrics={metrics?.customerMetrics} />
        </Grid>
      </Grid>

      {/* Data Tables Section */}
      <Grid container spacing={3}>
        {/* Top Selling Items */}
        <Grid item xs={12} md={6}>
          <TopSellingItems items={metrics?.topSellingItems || []} />
        </Grid>

        {/* Low Stock Alert */}
        <Grid item xs={12} md={6}>
          <LowStockAlert items={metrics?.lowStockItems || []} />
        </Grid>

        {/* Stock Movements */}
        <Grid item xs={12}>
          <StockMovementTable movements={stockMovements} />
        </Grid>
      </Grid>

      {/* Time Series Chart */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mt: { xs: 2, sm: 4 },
          overflow: "hidden",
        }}
      >
        <Typography
          variant={window.innerWidth <= 600 ? "subtitle1" : "h6"}
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          Daily Activity
        </Typography>
        <Box
          sx={{
            width: "100%",
            height: { xs: 250, sm: 300 },
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          <ResponsiveContainer
            width={Math.max(500, window.innerWidth - 80)}
            height="100%"
          >
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: window.innerWidth <= 600 ? 10 : 12 }}
                interval="preserveStartEnd"
                minTickGap={window.innerWidth <= 600 ? 20 : 40}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: window.innerWidth <= 600 ? 10 : 12 }}
                width={window.innerWidth <= 600 ? 40 : 60}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: window.innerWidth <= 600 ? 10 : 12 }}
                width={window.innerWidth <= 600 ? 40 : 60}
              />
              <RechartsTooltip
                wrapperStyle={{
                  fontSize: window.innerWidth <= 600 ? "12px" : "14px",
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: window.innerWidth <= 600 ? "5px" : "10px",
                  fontSize: window.innerWidth <= 600 ? "12px" : "14px",
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                stroke="#8884d8"
                name="Sales ($)"
                strokeWidth={window.innerWidth <= 600 ? 1.5 : 2}
                dot={{ r: window.innerWidth <= 600 ? 2 : 4 }}
                activeDot={{ r: window.innerWidth <= 600 ? 4 : 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="invoices"
                stroke="#82ca9d"
                name="Invoices"
                strokeWidth={window.innerWidth <= 600 ? 1.5 : 2}
                dot={{ r: window.innerWidth <= 600 ? 2 : 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="quotations"
                stroke="#ffc658"
                name="Quotations"
                strokeWidth={window.innerWidth <= 600 ? 1.5 : 2}
                dot={{ r: window.innerWidth <= 600 ? 2 : 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
