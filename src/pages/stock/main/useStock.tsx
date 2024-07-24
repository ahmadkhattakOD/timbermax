import { Checkbox, TableCell } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  getDateTimeFormatted,
  initialRowsPerPage,
  useDebouncedSearch,
} from "utils/helpers";
import ItemsRepository from "utils/repositories/itemsRepository";
import StocksRepository from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";

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
    label: "Quantity",
  },
  {
    id: "updated_at",
    numeric: false,
    disablePadding: true,
    label: "Updated At",
  },
];

export interface ValuesFilterStock {
  item: string;
  warehouse: string;
  minimumQuantity: string;
  maximumQuantity: string;
  updatedAtFrom: string;
  updatedAtTo: string;
}

const initialFilters: ValuesFilterStock = {
  item: "",
  warehouse: "",
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
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const navigate = useNavigate();

  function goToCreate() {
    navigate("/stock/new");
  }

  function goToMove() {
    navigate("/stock/move");
  }

  function generateTableCells(
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) {
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
        <TableCell sx={{ minWidth: 200 }}>{row.item.name}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.warehouse.name}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.quantity}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {getDateTimeFormatted(row.updated_at, true)}
        </TableCell>
      </React.Fragment>
    );
  }

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

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters]);

  function getDataCsv() {
    try {
      let csvString = "";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let stock = data[i] as any;
          csvString += `${stock?.item?.name ?? ""},${stock?.warehouse?.name ?? ""},${stock?.quantity ?? ""},${stock?.updated_at ?? ""}\n`;
        }

        setCsvData(csvString);

        setTimeout(() => {
          csvLink?.current?.link?.click();
        }, 2000);
      }
    } catch (e) {
      console.error("Error fetching items:", e);
      setLoading(false);
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
    } catch (error) {
      console.error("Error filtering stocks:", error);
    }
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  async function getFilterData() {
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
  }

  useEffect(() => {
    getFilterData();
  }, []);

  return {
    data,
    dataCount,
    loading,
    goToCreate,
    goToMove,
    order,
    setOrder,
    orderBy,
    setOrderBy,
    selected,
    setSelected,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    headCells,
    generateTableCells,
    onDelete,
    deleteConfirmModalOpen,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    filterModalOpen,
    openFilterModal,
    closeFilterModal,
    handleFiltersSubmit,
    validateFilters,
    filters,
    items,
    warehouses,
    resetFilters,
    getDataCsv,
    csvData,
    csvLink,
  };
}
