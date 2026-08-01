import React from 'react';
import { formatAmount } from 'utils/helpers';
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
  Stack
} from '@mui/material';
import { TrendingUp, LocalOffer } from '@mui/icons-material';

interface TopSellingItem {
  id: number;
  name: string;
  itemCode: string;
  quantitySold: number;
  revenue: number;
}

interface TopSellingItemsProps {
  items: TopSellingItem[];
}

const TopSellingItems: React.FC<TopSellingItemsProps> = ({ items }) => {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Top Selling Items
        </Typography>
        <Chip
          icon={<TrendingUp />}
          label="Best Sellers"
          color="primary"
          size="small"
          variant="outlined"
        />
      </Stack>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Code</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Revenue</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocalOffer fontSize="small" color="action" />
                    <Typography variant="body2">{item.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={item.itemCode} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {formatAmount(item.quantitySold)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    ${formatAmount(item.revenue)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="textSecondary">No data available</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TopSellingItems;