import React from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Stack,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  TrendingDown,
  TrendingUp,
  SwapHoriz,
  Adjust,
  Description,
  Receipt,
  MoreVert,
  AccountTree,
  Settings,
} from "@mui/icons-material";
import { StockMovement } from "./useDashboard";

interface StockMovementTableProps {
  movements: StockMovement[];
}

const StockMovementTable: React.FC<StockMovementTableProps> = ({
  movements,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "in":
        return <TrendingUp />;
      case "out":
        return <TrendingDown />;
      case "transfer":
        return <SwapHoriz />;
      case "adjustment":
        return <Adjust />;
      case "reserve":
        return <Description />;
      case "release":
        return <AccountTree />;
      default:
        return <Settings />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "in":
        return "success";
      case "out":
        return "error";
      case "transfer":
        return "info";
      case "adjustment":
        return "warning";
      case "reserve":
        return "primary";
      case "release":
        return "secondary";
      default:
        return "default";
    }
  };

  const getReferenceIcon = (type?: string) => {
    switch (type) {
      case "invoice":
        return <Receipt />;
      case "quotation":
        return <Description />;
      case "manual":
        return <Settings />;
      default:
        return <AccountTree />;
    }
  };

  const getQuantityDisplay = (movement: StockMovement) => {
    const { quantityChange, movementType } = movement;
    const color = getMovementColor(movementType);
    const sign = quantityChange >= 0 ? "+" : "";
    
    return (
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={1}
      >
        {getMovementIcon(movementType)}
        <Typography
          variant="body2"
          color={color}
          fontWeight="medium"
        >
          {sign}{quantityChange}
        </Typography>
      </Stack>
    );
  };

  return (
    <Paper sx={{ 
      p: isMobile ? 2 : 3,
      overflow: 'hidden'
    }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600 }}>
          Stock Movements
        </Typography>
        <Chip
          label={`${movements.length} movements`}
          size={isMobile ? "small" : "medium"}
          variant="outlined"
          sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
        />
      </Stack>

      <TableContainer sx={{ 
        maxHeight: isMobile ? 350 : 400,
        overflow: 'auto'
      }}>
        <Table size={isMobile ? "small" : "medium"} stickyHeader>
          {!isMobile ? (
            // Desktop View
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell align="right">Quantity Change</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
          ) : (
            // Mobile View Header
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Movement Details</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Change</TableCell>
              </TableRow>
            </TableHead>
          )}
          
          <TableBody>
            {movements.map((movement, index) => (
              !isMobile ? (
                // Desktop Row
                <TableRow key={movement.id || index} hover>
                  <TableCell>
                    <Stack direction="column" spacing={0.5}>
                      <Typography variant="body2" fontWeight="medium">
                        {movement.itemName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {movement.itemCode}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{movement.warehouseName}</TableCell>
                  <TableCell align="right">
                    {getQuantityDisplay(movement)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getMovementIcon(movement.movementType)}
                      label={movement.movementType}
                      size="small"
                      color={getMovementColor(movement.movementType) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {movement.referenceNumber ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getReferenceIcon(movement.referenceType)}
                        <Typography variant="body2">
                          {movement.referenceNumber}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        System
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {movement.userName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(movement.date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ) : (
                // Mobile Row - Compact View
                <TableRow key={movement.id || index} hover>
                  <TableCell>
                    <Stack direction="column" spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                            {movement.itemName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            {movement.itemCode}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            {movement.warehouseName}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 1 }}>
                          {getQuantityDisplay(movement)}
                        </Box>
                      </Stack>
                      
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Chip
                          icon={getMovementIcon(movement.movementType)}
                          label={movement.movementType}
                          size="small"
                          color={getMovementColor(movement.movementType) as any}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="textSecondary">
                          {new Date(movement.date).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      
                      {movement.referenceNumber && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {getReferenceIcon(movement.referenceType)}
                          <Typography variant="caption">
                            {movement.referenceNumber}
                          </Typography>
                        </Stack>
                      )}
                      
                      {movement.notes && (
                        <Typography variant="caption" color="textSecondary" sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {movement.notes}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            ))}
            
            {movements.length === 0 && (
              <TableRow>
                <TableCell colSpan={isMobile ? 2 : 7} align="center">
                  <Typography color="textSecondary" py={2}>
                    No stock movements found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default StockMovementTable;