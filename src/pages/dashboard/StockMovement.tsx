import React from 'react';
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
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Description,
  Visibility
} from '@mui/icons-material';
import { StockMovement } from './useDashboard';

interface StockMovementTableProps {
  movements: StockMovement[];
}

const StockMovementTable: React.FC<StockMovementTableProps> = ({ movements }) => {
  const getMovementColor = (type: 'in' | 'out') => {
    return type === 'in' ? 'success' : 'error';
  };

  const getMovementIcon = (type: 'in' | 'out') => {
    return type === 'in' ? <TrendingUp /> : <TrendingDown />;
  };

  const getReferenceIcon = (type: 'quotation' | 'invoice') => {
    return type === 'invoice' ? <Receipt /> : <Description />;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Stock Movements
        </Typography>
        <Chip
          label={`${movements.length} movements`}
          size="small"
          variant="outlined"
        />
      </Stack>
      
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movements.map((movement, index) => (
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
                  <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                    {getMovementIcon(movement.movementType)}
                    <Typography
                      variant="body2"
                      color={getMovementColor(movement.movementType)}
                      fontWeight="medium"
                    >
                      {movement.movementType === 'in' ? '+' : '-'}{movement.quantity}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getMovementIcon(movement.movementType)}
                    label={movement.movementType === 'in' ? 'Stock In' : 'Stock Out'}
                    size="small"
                    color={getMovementColor(movement.movementType)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {getReferenceIcon(movement.referenceType)}
                    <Typography variant="body2">{movement.referenceNumber}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {new Date(movement.date).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small">
                    <Visibility fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {movements.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">No stock movements found</Typography>
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