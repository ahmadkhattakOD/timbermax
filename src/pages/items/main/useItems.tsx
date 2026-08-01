import { Checkbox, CircularProgress, IconButton, TableCell, Tooltip } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import { Copy } from "iconsax-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  formatAmount,
  initialRowsPerPage,
  useDebouncedSearch,
} from "utils/helpers";
import ItemsRepository from "utils/repositories/itemsRepository";

const headCells: HeadCell[] = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "Item specification",
  },
  {
    id: "totalQuantity",
    numeric: true,
    disablePadding: false,
    label: "Total Quantity",
  },
  {
    id: "vendor",
    numeric: false,
    disablePadding: false,
    label: "Vendor",
  },
  {
    id: "description",
    numeric: false,
    disablePadding: true,
    label: "Category",
  },
  {
    id: "itemCode",
    numeric: false,
    disablePadding: false,
    label: "Item Code",
  },
  {
    id: "sellPrice",
    numeric: true,
    disablePadding: false,
    label: "Sell Price (ex GST)",
  },
  {
    id: "purchasePrice",
    numeric: true,
    disablePadding: false,
    label: "Purchase Price (ex GST)",
  },
  {
    id: "actions",
    numeric: false,
    disablePadding: false,
    label: "Actions",
  },
];

export interface ValuesFilterItems {
  name: string;
  description: string;
  itemCode: string;
  vendor_name: string;
}

const initialFilters: ValuesFilterItems = {
  name: "",
  description: "",
  itemCode: "",
  vendor_name: "",
};

export function useItems() {
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<ValuesFilterItems>(initialFilters);
  const [searchValue, setSearchValue] = useState("");
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const navigate = useNavigate();

  function goToCreate() {
    navigate("/items/new");
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilters((prev) => ({ ...prev, name: e.target.value }));
  }

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

  async function duplicateItem(event: React.MouseEvent, row: any) {
    event.stopPropagation();
    setDuplicatingId(row.id);
    try {
      const itemsRepository = new ItemsRepository();
      const baseName = row.name ?? "";
      // Build a name like "Widget (copy)" or "Widget (copy 2)", etc.
      const copyLabel = baseName.match(/\(copy(?: (\d+))?\)$/)
        ? (() => {
            const match = baseName.match(/^(.*?)\s*\(copy(?: (\d+))?\)$/);
            const prefix = match ? match[1] : baseName;
            const num = match && match[2] ? parseInt(match[2], 10) + 1 : 2;
            return `${prefix} (copy ${num})`;
          })()
        : `${baseName} (copy)`;

      const duplicated = await itemsRepository.create({
        name: copyLabel,
        description: row.description ?? "",
        itemCode: row.itemCode ?? "",
        sellPrice: row.sellPrice ?? 0,
        purchasePrice: row.purchasePrice ?? 0,
        gst: row.gst ?? false,
        vendor_id: row.vendor_id ?? undefined,
      });

      if (duplicated) {
        openSnackbar({
          open: true,
          message: `Item duplicated successfully.`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
        await getData();
      } else {
        openSnackbar({
          open: true,
          message: "Item could not be duplicated. Please try again.",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
      }
    } catch (e) {
      console.error("Error duplicating item:", e);
      openSnackbar({
        open: true,
        message: "Item could not be duplicated. Please try again.",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      setDuplicatingId(null);
    }
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
        <TableCell
          component="th"
          id={labelId}
          scope="row"
          padding="none"
          width={200}
          align="left"
        >
          {row.name}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }} align="right">
          {formatAmount(
            row.stocks?.reduce((sum: number, s: any) => sum + (s.quantity ?? 0), 0) ?? 0
          )}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {row.vendors?.name || '-'}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.description}</TableCell>
        <TableCell sx={{ minWidth: 120 }}>{row.itemCode}</TableCell>
        <TableCell sx={{ minWidth: 120 }} align="right">
          ${formatAmount(row.sellPrice)}
        </TableCell>
        <TableCell sx={{ minWidth: 140 }} align="right">
          ${formatAmount(row.purchasePrice)}
        </TableCell>
        <TableCell sx={{ minWidth: 80 }} align="center">
          <Tooltip title="Duplicate item">
            <span>
              <IconButton
                size="small"
                onClick={(e) => duplicateItem(e, row)}
                disabled={duplicatingId === row.id}
              >
                {duplicatingId === row.id ? (
                  <CircularProgress size={16} />
                ) : (
                  <Copy size={18} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>
      </React.Fragment>
    );
  }

  function openDeleteConfirmModal() {
    setDeleteConfirmModalOpen(true);
  }

  async function onDelete() {
    const itemsRepository = new ItemsRepository();
    const deletedItems = await itemsRepository.delete(selected);
    if (deletedItems > 0) {
      openSnackbar({
        open: true,
        message: `${deletedItems} item(s) deleted successfully.`,
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
        message: "Item(s) could not be deleted successfully. Please try again.",
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
      const itemsRepository = new ItemsRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const warehouses = await itemsRepository.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters
      );
      if (warehouses) {
        const { itemsData, itemsCount, itemsError } = warehouses;
        if (itemsData && !itemsError) {
          setData(itemsData);
          setDataCount(itemsCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching items:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters]);

  function getDataCsv() {
    try {
      let csvString = "Name,Total Quantity,Vendor,Description,Item Code,Sell Price,Purchase Price\n";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let item = data[i] as any;
          const totalQty = item?.stocks?.reduce((sum: number, s: any) => sum + (s.quantity ?? 0), 0) ?? 0;
          csvString += `${item?.name ?? ""},${formatAmount(totalQty)},${
            item?.vendors?.name ?? "-"
          },${item?.description ?? ""},${
            item?.itemCode ?? ""
          },${formatAmount(item?.sellPrice)},${formatAmount(
            item?.purchasePrice
          )}\n`;
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

  async function validateFilters(values: ValuesFilterItems) {
    const errors = {} as ValuesFilterItems;

    return errors;
  }

  async function handleFiltersSubmit(values: ValuesFilterItems) {
    try {
      setFilters(values);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering items:", error);
    }
  }

  function resetFilters() {
    setSearchValue("");
    setFilters(initialFilters);
  }

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
    closeDeleteConfirmModal,
    filterModalOpen,
    openFilterModal,
    closeFilterModal,
    handleFiltersSubmit,
    validateFilters,
    filters,
    resetFilters,
    getDataCsv,
    csvData,
    csvLink,
    handleSearchDebounced,
    searchValue,
    setSearchValue,
  };
}
