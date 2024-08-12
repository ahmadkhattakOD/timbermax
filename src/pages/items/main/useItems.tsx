import { Checkbox, TableCell } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { initialRowsPerPage, useDebouncedSearch } from "utils/helpers";
import ItemsRepository from "utils/repositories/itemsRepository";

const headCells: HeadCell[] = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "Name",
  },
  {
    id: "committed",
    numeric: true,
    disablePadding: true,
    label: "Committed",
  },
  {
    id: "description",
    numeric: false,
    disablePadding: true,
    label: "Description",
  },
];

export interface ValuesFilterItems {
  name: string;
  description: string;
}

const initialFilters: ValuesFilterItems = {
  name: "",
  description: "",
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
  const [filters, setFilters] = useState<ValuesFilterItems>(initialFilters);
  const [searchValue, setSearchValue] = useState("");
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const navigate = useNavigate();

  function goToCreate() {
    navigate("/items/new");
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    let temp = { ...filters };
    temp.name = e.target.value;
    setFilters(temp);
  }

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

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
        <TableCell sx={{ minWidth: 200, textAlign: "right" }}>
          {row.committed}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.description}</TableCell>
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
      let csvString = "";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let item = data[i] as any;
          csvString += `${item?.name ?? ""},${item?.description ?? ""}\n`;
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
