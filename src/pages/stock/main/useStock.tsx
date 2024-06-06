import { Checkbox, TableCell } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { getDateFormatted, getDateTimeFormatted, initialRowsPerPage } from "utils/helpers";
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
  const navigate = useNavigate();

  function goToCreate() {
    navigate("/stock/new");
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
        <TableCell sx={{ minWidth: 200 }}>{getDateTimeFormatted(row.updated_at, true)}</TableCell>
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
        message: "Stock(s) could not be deleted successfully. Please try again.",
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
        rowsPerPage
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
  }, [order, orderBy, page, rowsPerPage]);

  return {
    data,
    dataCount,
    loading,
    goToCreate,
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
    closeDeleteConfirmModal
  };
}
