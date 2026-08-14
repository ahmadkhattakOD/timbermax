import {
  Checkbox,
  TableCell,
  Typography,
  Chip,
  Box,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { getStockStyles } from "utils/getColors";
import {
  formatAmount,
  getDateTimeFormatted,
  initialRowsPerPage,
  useDebouncedSearch,
} from "utils/helpers";
import ItemsRepository from "utils/repositories/itemsRepository";
import StocksRepository from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";
import { Eye } from "iconsax-react";
import StockReservationsModal from "components/stock-reservation-modal";

const headCells: HeadCell[] = [
  {
    id: "item",
    numeric: false,
    disablePadding: true,
    label: "Item",
  },
  {
    id: "category",
    numeric: false,
    disablePadding: true,
    label: "Category",
  },
  {
    id: "warehouse",
    numeric: false,
    disablePadding: true,
    label: "Warehouse",
  },
  {
    id: "quantity",
    numeric: false,
    disablePadding: true,
    label: "Total Quantity",
  },
  {
    id: "reserved",
    numeric: false,
    disablePadding: true,
    label: "Reserved",
  },
  {
    id: "available",
    numeric: false,
    disablePadding: true,
    label: "Available",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: true,
    label: "Status",
  },
  {
    id: "last_updated_by",
    numeric: false,
    disablePadding: true,
    label: "Last Updated By",
  },
  {
    id: "updated_at",
    numeric: false,
    disablePadding: true,
    label: "Updated At",
  },
  {
    id: "actions",
    numeric: false,
    disablePadding: true,
    label: "Actions",
  },
];

export interface ValuesFilterStock {
  item: string;
  warehouse: string;
  status: string;
  minimumQuantity: string;
  maximumQuantity: string;
  updatedAtFrom: string;
  updatedAtTo: string;
  category: string;
}

const initialFilters: ValuesFilterStock = {
  item: "",
  warehouse: "",
  status: "",
  minimumQuantity: "",
  maximumQuantity: "",
  updatedAtFrom: "",
  updatedAtTo: "",
  category: "",
};

// History Modal Component
const StockHistoryModal = ({
  open,
  onClose,
  itemId,
  warehouseId,
  itemName,
}: {
  open: boolean;
  onClose: () => void;
  itemId: number;
  warehouseId: number;
  itemName: string;
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  const fetchHistory = async () => {
    setLoading(true);
    const stocksRepo = new StocksRepository();
    const result = await stocksRepo.getMovementHistoryWithUsers(
      itemId,
      warehouseId,
      100,
    );
    if (result.data) {
      setHistory(result.data);
    }
    setLoading(false);
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "in":
        return "success.main";
      case "out":
        return "error.main";
      case "reserve":
        return "warning.main";
      case "release":
        return "info.main";
      case "adjustment":
        return "primary.main";
      default:
        return "text.primary";
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "in":
        return "⬆️";
      case "out":
        return "⬇️";
      case "reserve":
        return "⏸️";
      case "release":
        return "▶️";
      case "adjustment":
        return "✏️";
      default:
        return "📝";
    }
  };

  const formatUser = (user: any) => {
    if (!user) return "System";
    return user.user_metadata?.name || user.email || "Unknown User";
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Stock History: {itemName}</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Before</TableCell>
                <TableCell>Change</TableCell>
                <TableCell>After</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading history...
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No history found
                  </TableCell>
                </TableRow>
              ) : (
                history.map((movement, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(movement.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <span>{getMovementIcon(movement.movement_type)}</span>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: getMovementColor(movement.movement_type),
                              fontWeight: "bold",
                            }}
                          >
                            {movement.movement_type.toUpperCase()}
                          </Typography>
                          {movement.movement_type === "adjustment" && (
                            <Chip
                              label="CORRECTION"
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontSize: "0.65rem", height: 18 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{formatUser(movement.user)}</TableCell>
                    <TableCell>{formatAmount(movement.quantity_before)}</TableCell>
                    <TableCell>
                      <Typography
                        color={
                          movement.movement_type === "in"
                            ? "success.main"
                            : movement.movement_type === "out"
                              ? "error.main"
                              : movement.quantity_change >= 0
                                ? "success.main"
                                : "error.main"
                        }
                        fontWeight="bold"
                      >
                        {movement.quantity_change >= 0 ? "+" : ""}
                        {formatAmount(movement.quantity_change)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatAmount(movement.quantity_after)}</TableCell>
                    <TableCell>
                      {movement.movement_type === "adjustment" && movement.notes ? (
                        <Box>
                          <Typography
                            variant="caption"
                            color="warning.main"
                            fontWeight={600}
                            display="block"
                          >
                            {movement.notes.replace(/^\[CORRECTION\]\s*/, "")}
                          </Typography>
                        </Box>
                      ) : (
                        movement.notes || "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export function useStock() {
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<ValuesFilterStock>(initialFilters);
  const [searchValue, setSearchValue] = useState("");
  const [csvData, setCsvData] = useState<string>("");
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const csvLink = useRef<any>();
  const navigate = useNavigate();
  const location = useLocation();

  function goToCreate() {
    navigate("/stock/new");
  }

  function goToMove() {
    navigate("/stock/move");
  }

  function goToStatus(status: string) {
    const params = new URLSearchParams(location.search);
    params.set("status", status);
    navigate(`/stock?${params.toString()}`);
  }

  function generateTableCells(
    row: any,
    labelId: string,
    isItemSelected: boolean,
  ) {
    const quantity = parseFloat(row.quantity) || 0;
    const reserved = parseFloat(row.reserved) || 0;
    const available = quantity - reserved;

    const getStatusColor = (status: string) => {
      switch (status) {
        case "available":
          return "success";
        case "on_hold":
          return "warning";
        case "committed":
          return "info";
        case "damaged":
          return "error";
        default:
          return "default";
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case "available":
          return "Available";
        case "on_hold":
          return "On Hold";
        case "committed":
          return "Committed";
        case "damaged":
          return "Damaged";
        default:
          return status;
      }
    };

    return (
      <React.Fragment>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={isItemSelected}
            inputProps={{
              "aria-labelledby": labelId,
            }}
          />
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          <Box>
            <Typography variant="body1" fontWeight={600}>
              {row.item?.name || "Unknown Item"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Code: {row.item?.itemCode || "N/A"}
            </Typography>
          </Box>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {row.item?.description || "-"}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {row.warehouse?.name || "Unknown Warehouse"}
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Typography fontWeight={600}>{quantity.toFixed(2)}</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={reserved.toFixed(2)}
              size="small"
              color={reserved > 0 ? "warning" : "default"}
              variant={reserved > 0 ? "filled" : "outlined"}
            />
            {reserved > 0 && (
              <Tooltip title="View Reservations">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewReservations(row);
                  }}
                  color="primary"
                  sx={{ ml: 1 }}
                >
                  <Eye size={14} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 14,
              ...getStockStyles(available),
            }}
          >
            {available.toFixed(2)}
          </div>
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Chip
            label={getStatusLabel(row.status)}
            size="small"
            color={getStatusColor(row.status) as any}
            variant="filled"
          />
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <Tooltip title={row.last_updated_by || "System"}>
            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
              {row.last_updated_by || "System"}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {new Date(row.updated_at).toLocaleDateString()}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Tooltip title="View Stock History">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewHistory(row);
                }}
                color="primary"
              >
                History
              </IconButton>
            </Tooltip>
            <Tooltip title="Correct Stock Quantity">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/stock/${row.id}/edit`);
                }}
                color="warning"
              >
                Edit
              </IconButton>
            </Tooltip>
            {reserved > 0 && (
              <Tooltip title="View Reservations">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewReservations(row);
                  }}
                  color="info"
                >
                  <Eye size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      </React.Fragment>
    );
  }

  const handleViewReservations = (stockRow: any) => {
    setSelectedItem({
      id: stockRow.item?.id,
      warehouseId: stockRow.warehouse?.id || 1,
      name: stockRow.item?.name || "Unknown Item",
      code: stockRow.item?.itemCode || "N/A",
    });
    setReservationModalOpen(true);
  };

  const handleViewHistory = (stockRow: any) => {
    setSelectedHistoryItem({
      itemId: stockRow.item?.id,
      warehouseId: stockRow.warehouse?.id || 1,
      name: stockRow.item?.name || "Unknown Item",
    });
    setHistoryModalOpen(true);
  };

  const handleCloseReservationModal = () => {
    setReservationModalOpen(false);
    setSelectedItem(null);
  };

  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
    setSelectedHistoryItem(null);
  };

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    // Functional update avoids stale closure — always merges into latest filters state
    // regardless of how many re-renders happened between keystroke and debounce firing.
    setFilters((prev) => ({ ...prev, item: value.trim() ? value : "" }));
    setPage(0);
  }

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

  function openDeleteConfirmModal() {
    setDeleteConfirmModalOpen(true);
  }

  async function onDelete() {
    const stocksRepository = new StocksRepository();
    const deletedStocks = await stocksRepository.delete(selected);
    if (deletedStocks > 0) {
      openSnackbar({
        open: true,
        message: `${deletedStocks} stock(s) deleted successfully.`,
        variant: "alert",
        alert: {
          color: "success",
        },
      } as SnackbarProps);
      setSelected([]);
      await getData();
    } else {
      openSnackbar({
        open: true,
        message:
          "Stock(s) could not be deleted successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
  }

  function closeDeleteConfirmModal() {
    setDeleteConfirmModalOpen(false);
  }

  function openFilterModal() {
    setFilterModalOpen(true);
  }

  function closeFilterModal() {
    setFilterModalOpen(false);
  }

  async function getData() {
    try {
      setLoading(true);
      const stocksRepository = new StocksRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;

      // Use the new method that includes last user info
      const stocks = await stocksRepository.getStockWithLastUser(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters,
      );

      if (stocks) {
        const { stocksData, stocksCount, stocksError } = stocks;
        if (stocksData && !stocksError) {
          setData(stocksData);
          setDataCount(stocksCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching stocks:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters = { ...initialFilters };

    if (params.has("status")) newFilters.status = params.get("status") || "";
    if (params.has("item")) newFilters.item = params.get("item") || "";
    if (params.has("warehouse"))
      newFilters.warehouse = params.get("warehouse") || "";
    if (params.has("minimumQuantity"))
      newFilters.minimumQuantity = params.get("minimumQuantity") || "";
    if (params.has("maximumQuantity"))
      newFilters.maximumQuantity = params.get("maximumQuantity") || "";
    if (params.has("updatedAtFrom"))
      newFilters.updatedAtFrom = params.get("updatedAtFrom") || "";
    if (params.has("updatedAtTo"))
      newFilters.updatedAtTo = params.get("updatedAtTo") || "";
    if (params.has("category"))
      newFilters.category = params.get("category") || "";

    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      setFilters(newFilters);
      // Keep the search box in sync with the item param from URL
      setSearchValue(newFilters.item);
    }
  }, [location.search]);

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters]);

  function getDataCsv() {
    try {
      let csvString =
        "Item,Item Code,Warehouse,Total Quantity,Reserved,Available,Status,Last Updated By,Updated At\n";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let stock = data[i] as any;
          const quantity = parseFloat(stock.quantity) || 0;
          const reserved = parseFloat(stock.reserved) || 0;
          const available = quantity - reserved;

          csvString += `"${stock?.item?.name ?? ""}","${stock?.item?.itemCode ?? ""}","${stock?.warehouse?.name ?? ""}",${formatAmount(quantity)},${formatAmount(reserved)},${formatAmount(available)},"${stock?.status ?? ""}","${stock?.last_updated_by ?? "System"}","${stock?.updated_at ?? ""}"\n`;
        }

        setCsvData(csvString);

        setTimeout(() => {
          if (csvLink?.current?.link) {
            csvLink.current.link.click();
          }
        }, 2000);
      }
    } catch (e) {
      console.error("Error generating CSV:", e);
    }
  }

  async function validateFilters(values: ValuesFilterStock) {
    const errors = {} as ValuesFilterStock;
    return errors;
  }

  async function handleFiltersSubmit(values: ValuesFilterStock) {
    try {
      setFilters(values);
      // Keep search box in sync with the item filter applied from the modal
      setSearchValue(values.item || "");
      setPage(0);
      setFilterModalOpen(false);

      const params = new URLSearchParams();
      Object.entries(values).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      navigate(`/stock?${params.toString()}`);
    } catch (error) {
      console.error("Error filtering stocks:", error);
    }
  }

  function resetFilters() {
    setSearchValue("");
    setFilters(initialFilters);
    setPage(0);
    navigate("/stock");
  }

  async function getFilterData() {
    try {
      const itemsRepository = new ItemsRepository();
      const allItems = await itemsRepository.getWithoutFilters();
      if (allItems) {
        const { itemsData, itemsError } = allItems;
        if (itemsData && !itemsError) {
          setItems(itemsData);
        }
      }

      const warehousesRepository = new WarehousesRepository();
      const allWarehouses = await warehousesRepository.getWithoutFilters();
      if (allWarehouses) {
        const { warehousesData, warehousesError } = allWarehouses;
        if (warehousesData && !warehousesError) {
          setWarehouses(warehousesData);
        }
      }
    } catch (error) {
      console.error("Error loading filter data:", error);
    }
  }

  useEffect(() => {
    getFilterData();
  }, []);

  return {
    // State
    data,
    dataCount,
    loading,
    order,
    orderBy,
    selected,
    page,
    rowsPerPage,
    deleteConfirmModalOpen,
    filterModalOpen,
    filters,
    items,
    warehouses,
    searchValue,
    csvData,
    csvLink,
    reservationModalOpen,
    historyModalOpen,
    selectedItem,
    selectedHistoryItem,

    // State setters
    setOrder,
    setOrderBy,
    setSelected,
    setPage,
    setRowsPerPage,
    setSearchValue,

    // Functions
    goToCreate,
    goToMove,
    goToStatus,
    generateTableCells,
    onDelete,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    openFilterModal,
    closeFilterModal,
    handleFiltersSubmit,
    validateFilters,
    resetFilters,
    getDataCsv,
    handleSearchDebounced,
    handleViewReservations,
    handleViewHistory,
    handleCloseReservationModal,
    handleCloseHistoryModal,

    // Constants
    headCells,
    StockHistoryModal,
  };
}
