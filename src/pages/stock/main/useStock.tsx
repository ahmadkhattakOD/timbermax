import { Checkbox, TableCell, Typography, Chip, Box, Tooltip, IconButton } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { getStockStyles } from "utils/getColors";
import {
  getDateTimeFormatted,
  initialRowsPerPage,
  useDebouncedSearch,
} from "utils/helpers";
import ItemsRepository from "utils/repositories/itemsRepository";
import StocksRepository from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";
import { Eye } from "iconsax-react";

const headCells: HeadCell[] = [
  {
    id: "item",
    numeric: false,
    disablePadding: true,
    label: "Item",
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
    id: "reference",
    numeric: false,
    disablePadding: true,
    label: "Held For",
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
}

const initialFilters: ValuesFilterStock = {
  item: "",
  warehouse: "",
  status: "",
  minimumQuantity: "",
  maximumQuantity: "",
  updatedAtFrom: "",
  updatedAtTo: "",
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
  const csvLink = useRef<any>();
  const navigate = useNavigate();
  const location = useLocation(); // Use React Router's location hook

  function goToCreate() {
    navigate("/stock/new");
  }

  function goToMove() {
    navigate("/stock/move");
  }

  function goToStatus(status: string) {
    // Update URL with status filter
    const params = new URLSearchParams(location.search);
    params.set('status', status);
    navigate(`/stock?${params.toString()}`);
  }

  function generateTableCells(
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) {
    const quantity = parseFloat(row.quantity) || 0;
    const reserved = parseFloat(row.reserved) || 0;
    const available = quantity - reserved;
    
    const getStatusColor = (status: string) => {
      switch(status) {
        case 'available': return 'success';
        case 'on_hold': return 'warning';
        case 'committed': return 'info';
        case 'damaged': return 'error';
        default: return 'default';
      }
    };

    const getStatusLabel = (status: string) => {
      switch(status) {
        case 'available': return 'Available';
        case 'on_hold': return 'On Hold';
        case 'committed': return 'Committed';
        case 'damaged': return 'Damaged';
        default: return status;
      }
    };

    const getReferenceLabel = (row: any) => {
      if (!row.reference_type || row.reference_type === 'none' || !row.reference_id) {
        return "None";
      }
      
      const type = row.reference_type === 'quotation' ? 'Quotation' : 
                   row.reference_type === 'invoice' ? 'Invoice' : 
                   row.reference_type === 'sales_order' ? 'Sales Order' : row.reference_type;
      
      return `${type} #${row.reference_id}`;
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
          {row.warehouse?.name || "Unknown Warehouse"}
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Typography fontWeight={600}>
            {quantity.toFixed(2)}
          </Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Chip 
            label={reserved.toFixed(2)} 
            size="small"
            color={reserved > 0 ? "warning" : "default"}
            variant={reserved > 0 ? "filled" : "outlined"}
          />
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
          <Typography variant="body2">
            {getReferenceLabel(row)}
          </Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {getDateTimeFormatted(row.updated_at, true)}
        </TableCell>
        <TableCell sx={{ minWidth: 100 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {row.reference_type && row.reference_type !== 'none' && row.reference_id && (
              <Tooltip title={`View ${row.reference_type === 'quotation' ? 'Quotation' : 'Invoice'}`}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    viewReference(row.reference_type, row.reference_id);
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

  async function viewReference(referenceType: string, referenceId: number) {
    try {
      if (referenceType === 'quotation') {
        navigate(`/quotations/view/${referenceId}`);
      } else if (referenceType === 'invoice') {
        navigate(`/invoices/view/${referenceId}`);
      } else {
        openSnackbar({
          open: true,
          message: `Cannot view ${referenceType}.`,
          variant: "alert",
          alert: { color: "warning" },
        } as SnackbarProps);
      }
    } catch (error: any) {
      console.error("Error viewing reference:", error);
      openSnackbar({
        open: true,
        message: `Failed to view reference: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchValue(value);
    
    // Update filters for item name search
    if (value.trim()) {
      let temp = { ...filters };
      temp.item = value; // This will search by item name
      setFilters(temp);
    } else {
      let temp = { ...filters };
      temp.item = "";
      setFilters(temp);
    }
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
      
      // Get stocks with all fields including reserved, status, and references
      const stocks = await stocksRepository.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters
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

  // Sync URL with filters and fetch data when URL changes
  useEffect(() => {
    // Parse URL parameters and update filters
    const params = new URLSearchParams(location.search);
    const newFilters = { ...initialFilters };
    
    // Update filters from URL
    if (params.has('status')) newFilters.status = params.get('status') || '';
    if (params.has('item')) newFilters.item = params.get('item') || '';
    if (params.has('warehouse')) newFilters.warehouse = params.get('warehouse') || '';
    if (params.has('minimumQuantity')) newFilters.minimumQuantity = params.get('minimumQuantity') || '';
    if (params.has('maximumQuantity')) newFilters.maximumQuantity = params.get('maximumQuantity') || '';
    if (params.has('updatedAtFrom')) newFilters.updatedAtFrom = params.get('updatedAtFrom') || '';
    if (params.has('updatedAtTo')) newFilters.updatedAtTo = params.get('updatedAtTo') || '';
    
    // Only update if filters actually changed
    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      setFilters(newFilters);
    }
  }, [location.search]); // Run when URL search changes

  // Fetch data when filters change
  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters]);

  function getDataCsv() {
    try {
      let csvString = "Item,Item Code,Warehouse,Total Quantity,Reserved,Available,Status,Held For,Reference ID,Updated At\n";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let stock = data[i] as any;
          const quantity = parseFloat(stock.quantity) || 0;
          const reserved = parseFloat(stock.reserved) || 0;
          const available = quantity - reserved;
          
          csvString += `"${stock?.item?.name ?? ''}","${stock?.item?.itemCode ?? ''}","${stock?.warehouse?.name ?? ''}",${quantity},${reserved},${available},"${stock?.status ?? ''}","${stock?.reference_type === 'quotation' ? 'Quotation' : stock?.reference_type === 'invoice' ? 'Invoice' : stock?.reference_type || 'None'}","${stock?.reference_id || ''}","${stock?.updated_at ?? ''}"\n`;
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
      setFilterModalOpen(false);
      
      // Update URL with new filters
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
    navigate('/stock'); // Clear URL parameters
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
    viewReference,
    
    // Constants
    headCells,
  };
}