// components/StockReservationsModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Divider,
} from "@mui/material";
import { CloseCircle, Eye, Calendar } from "iconsax-react";
import ActionButton from "components/ActionButton";
import { getDateFormatted } from "utils/helpers";
import StocksRepository from "utils/repositories/stocksRepository";
import { useNavigate } from "react-router-dom";

interface StockReservationsModalProps {
  open: boolean;
  onClose: () => void;
  itemId: number;
  warehouseId: number;
  itemName: string;
  itemCode: string;
}

interface ReservationData {
  id: number;
  quantity: number;
  status: string;
  created_at: string;
  quotation_id: number;
  quotation_number?: string;
  customer_name?: string;
  quotation_status?: string;
}

const StockReservationsModal: React.FC<StockReservationsModalProps> = ({
  open,
  onClose,
  itemId,
  warehouseId,
  itemName,
  itemCode,
}) => {
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [totalReserved, setTotalReserved] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && itemId) {
      loadReservations();
    }
  }, [open, itemId, warehouseId]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const stocksRepo = new StocksRepository();
      
      // Get total reserved
      const reservedResult = await stocksRepo.getTotalReservedForItem(itemId, warehouseId);
      if (reservedResult.success) {
        setTotalReserved(reservedResult.totalReserved!);
      }
      
      // Get detailed reservations
      const { data } = await stocksRepo.getReservedStockByItem(itemId, warehouseId);
      console.log("second data",data)
      if (data) {
        const formattedReservations = data.map((res: any) => ({
          id: res.id,
          quantity: parseFloat(res.quantity),
          status: res.status,
          created_at: res.created_at,
          quotation_id: res.quotation_id,
          quotation_number: res.quotations?.quotation_number || `QT-${res.quotation_id}`,
          customer_name: res.quotations.customers?.name || "Unknown Customer",
          quotation_status: res.quotations?.status || "unknown",
        }));
        setReservations(formattedReservations);
      }
    } catch (error) {
      console.error("Error loading reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuotation = (quotationId: number) => {
    navigate(`/quotations/view/${quotationId}`);
    onClose();
  };

 
  const getQuotationStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'info';
      case 'approved': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        pb: 2
      }}>
        <Box>
          <Typography variant="h6" component="div">
            Stock Reservations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {itemName} ({itemCode})
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseCircle size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary */}
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: '#f5f5f5', 
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Reserved Quantity
                </Typography>
                <Typography variant="h4" color="primary">
                  {totalReserved.toFixed(2)}
                </Typography>
              </Box>
              <Chip 
                label="On Hold" 
                color="warning" 
                size="small"
                variant="filled"
              />
            </Box>

            {reservations.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No active reservations found
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Quotation</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="center">Quotation Status</TableCell>
                      <TableCell align="center">Reservation Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {reservation.quotation_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {reservation.customer_name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={reservation.quantity.toFixed(2)}
                            size="small"
                            color="warning"
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={reservation.quotation_status?.charAt(0).toUpperCase() + reservation.quotation_status?.slice(1)! || ""}
                            size="small"
                            color={getQuotationStatusColor(reservation.quotation_status || "test") as any}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                            <Calendar size={14} />
                            <Typography variant="body2">
                              {getDateFormatted(reservation.created_at)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewQuotation(reservation.quotation_id)}
                            color="primary"
                          >
                            <Eye size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        borderTop: '1px solid #e0e0e0', 
        pt: 2, 
        pb: 2, 
        px: 3 
      }}>
        <ActionButton 
          text="Close" 
          color="secondary" 
          onClick={onClose}
        />
      </DialogActions>
    </Dialog>
  );
};

export default StockReservationsModal;