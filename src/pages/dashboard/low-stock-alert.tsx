import React from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Stack,
  Button,
  LinearProgress,
} from "@mui/material";
import { Warning, Inventory, Add, Remove } from "@mui/icons-material";

interface LowStockItem {
  id: number;
  name: string;
  itemCode: string;
  quantity: number;
  reserved: number;
  available: number;
}

interface LowStockAlertProps {
  items: LowStockItem[];
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ items }) => {
  const getStockLevelColor = (available: number) => {
    if (available <= 0) return "error";
    if (available < 5) return "warning";
    return "success";
  };

  const getStockLevelText = (available: number) => {
    if (available <= 0) return "Out of Stock";
    if (available < 5) return "Low Stock";
    return "In Stock";
  };

  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" gutterBottom>
          Low Stock Alert
        </Typography>
        <Chip
          icon={<Warning />}
          label={`${items.filter((item) => item.available < 5).length} items need attention`}
          color="warning"
          size="small"
        />
      </Stack>

      <List dense>
        {items.slice(0, 5).map((item) => (
          <ListItem key={item.id}>
            <ListItemIcon>
              <Inventory color={getStockLevelColor(item.available)} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight="medium">
                    {item.name}
                  </Typography>
                  <Chip label={item.itemCode} size="small" variant="outlined" />
                </Stack>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="textSecondary">
                      Available: {item.available}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Reserved: {item.reserved}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Total: {item.quantity}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      (item.available / item.quantity) * 100,
                      100
                    )}
                    color={getStockLevelColor(item.available)}
                    sx={{ mt: 1 }}
                  />
                </Box>
              }
            />
          </ListItem>
        ))}
        {items.length === 0 && (
          <ListItem>
            <ListItemText
              primary={
                <Typography color="textSecondary" align="center">
                  No low stock items
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>

      {items.length > 5 && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button size="small" variant="text">
            View all {items.length} items
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default LowStockAlert;
