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
} from "@mui/material";
import { Person, TrendingUp, Star} from "@mui/icons-material";

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
  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" gutterBottom>
          Customer Insights
        </Typography>
        <Chip
          icon={<TrendingUp />}
          label={`+${metrics?.newCustomers || 0} new`}
          color="success"
          size="small"
        />
      </Stack>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Top Customers
        </Typography>
        <List dense>
          {metrics?.topCustomers.map((customer, index) => (
            <ListItem
              key={customer.id}
              secondaryAction={
                <Stack direction="column" alignItems="flex-end" spacing={0.5}>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color="success.main"
                  >
                    $
                    {customer.totalSpent.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {customer.invoiceCount} invoices
                  </Typography>
                </Stack>
              }
            >
              <ListItemAvatar>
                <Avatar
                  sx={{ bgcolor: index < 3 ? "primary.main" : "grey.500" }}
                >
                  {index < 3 ? <Star /> : <Person />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight="medium">
                    {customer.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="textSecondary">
                    Customer #{customer.id}
                  </Typography>
                }
              />
            </ListItem>
          ))}
          {(!metrics?.topCustomers || metrics.topCustomers.length === 0) && (
            <ListItem>
              <ListItemText
                primary={
                  <Typography color="textSecondary" align="center">
                    No customer data available
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" spacing={3} justifyContent="space-around">
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" color="primary" gutterBottom>
            {metrics?.topCustomers.length || 0}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Active Customers
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" color="success" gutterBottom>
            {metrics?.newCustomers || 0}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            New This Period
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" color="warning" gutterBottom>
            {metrics?.topCustomers.reduce(
              (avg, customer) => avg + customer.totalSpent,
              0
            ) ||
              0 / (metrics?.topCustomers.length || 1) ||
              0}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Avg. Spend
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default CustomerMetrics;
