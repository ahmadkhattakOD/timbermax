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
  Receipt,
  Description,
  MoreVert,
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

  const getReferenceIcon = (type: "quotation" | "invoice") => {
    return type === "invoice" ? <Receipt /> : <Description />;
  };

  // Filter only stock out movements
  const stockOutMovements = movements.filter(mov => mov.movementType === "out");

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
          Recent Stock Out
        </Typography>
        <Chip
          label={`${stockOutMovements.length} movements`}
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
                <TableCell align="right">Quantity</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
          ) : (
            // Mobile View Header
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Stock Out Details</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
              </TableRow>
            </TableHead>
          )}
          
          <TableBody>
            {stockOutMovements.map((movement, index) => (
              !isMobile ? (
                // Desktop Row
                <TableRow key={index} hover>
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
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="flex-end"
                      spacing={1}
                    >
                      <TrendingDown color="error" />
                      <Typography
                        variant="body2"
                        color="error"
                        fontWeight="medium"
                      >
                        -{movement.quantity}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {getReferenceIcon(movement.referenceType)}
                      <Typography variant="body2">
                        {movement.referenceNumber}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {new Date(movement.date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ) : (
                // Mobile Row - Compact View
                <TableRow key={index} hover>
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
                        </Box>
                        <Typography
                          variant="body2"
                          color="error"
                          fontWeight="medium"
                          sx={{ ml: 1 }}
                        >
                          -{movement.quantity}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {getReferenceIcon(movement.referenceType)}
                          <Typography variant="caption">
                            {movement.referenceNumber}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(movement.date).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      
                      <Typography variant="caption" color="textSecondary">
                        {movement.warehouseName}
                      </Typography>
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
            
            {stockOutMovements.length === 0 && (
              <TableRow>
                <TableCell colSpan={isMobile ? 2 : 5} align="center">
                  <Typography color="textSecondary" py={2}>
                    No stock out movements found
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