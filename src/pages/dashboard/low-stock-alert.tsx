import React from "react";
import { formatAmount } from "utils/helpers";
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Warning, Inventory } from "@mui/icons-material";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
    <Paper sx={{ 
      p: isMobile ? 2 : 3, 
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600 }}>
          Low Stock Alert
        </Typography>
        <Chip
          icon={<Warning />}
          label={`${items.filter((item) => item.available < 5).length} items`}
          color="warning"
          size={isMobile ? "small" : "medium"}
          sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
        />
      </Stack>

      <Box sx={{ 
        flex: 1, 
        overflow: "auto",
        maxHeight: isMobile ? 300 : 400 
      }}>
        <List dense>
          {items.slice(0, isMobile ? 4 : 5).map((item) => (
            <ListItem 
              key={item.id}
              sx={{
                flexDirection: isMobile ? "column" : "row",
                alignItems: "flex-start",
                py: isMobile ? 1.5 : 1,
                px: isMobile ? 0.5 : 2,
                borderBottom: "1px solid #eee"
              }}
            >
              <Box sx={{ 
                width: "100%", 
                display: "flex", 
                alignItems: "center",
                mb: isMobile ? 1 : 0
              }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Inventory 
                    color={getStockLevelColor(item.available)}
                    sx={{ fontSize: isMobile ? "20px" : "24px" }}
                  />
                </ListItemIcon>
                <Box sx={{ flex: 1, overflow: "hidden" }}>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      fontSize: isMobile ? "0.875rem" : "0.9rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </Typography>
                  <Chip 
                    label={item.itemCode} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: isMobile ? "0.7rem" : "0.75rem", mt: 0.5 }}
                  />
                </Box>
              </Box>

              <Box sx={{ width: "100%", pl: isMobile ? 0 : 6 }}>
                <Stack 
                  direction="row" 
                  justifyContent="space-between" 
                  sx={{ mb: 1 }}
                >
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Available
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      color={getStockLevelColor(item.available)}
                    >
                      {formatAmount(item.available)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Reserved
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatAmount(item.reserved)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Total
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatAmount(item.quantity)}
                    </Typography>
                  </Box>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={Math.min((item.available / item.quantity) * 100, 100)}
                  color={getStockLevelColor(item.available)}
                  sx={{ 
                    height: 6,
                    borderRadius: 1,
                    mb: 0.5
                  }}
                />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    Stock Level
                  </Typography>
                  <Chip
                    label={getStockLevelText(item.available)}
                    size="small"
                    color={getStockLevelColor(item.available) as any}
                    sx={{ fontSize: isMobile ? "0.7rem" : "0.75rem" }}
                  />
                </Stack>
              </Box>
            </ListItem>
          ))}
          
          {items.length === 0 && (
            <ListItem>
              <ListItemText
                primary={
                  <Typography color="textSecondary" align="center" py={2}>
                    No low stock items
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </Box>

      {items.length > (isMobile ? 4 : 5) && (
        <Box sx={{ textAlign: "center", pt: 2 }}>
          <Button 
            size="small" 
            variant="text"
            sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
          >
            View all {items.length} items
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default LowStockAlert;