import { Typography } from "@mui/material";
import { Checkbox, TableCell } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  getDateTimeFormatted,
  initialRowsPerPage,
  stripEmail,
  useDebouncedSearch,
} from "utils/helpers";
import ProfilesRepository from "utils/repositories/profilesRepository";

const headCells: HeadCell[] = [
  {
    id: "full_name",
    numeric: false,
    disablePadding: true,
    label: "Full Name",
  },
  {
    id: "email",
    numeric: false,
    disablePadding: true,
    label: "Username",
  },
  {
    id: "role",
    numeric: false,
    disablePadding: true,
    label: "Role",
  },
  {
    id: "daily_wage",
    numeric: false,
    disablePadding: true,
    label: "Daily Wage (A$)",
  },
  {
    id: "commission",
    numeric: false,
    disablePadding: true,
    label: "Commission (%)",
  },
  {
    id: "created_at",
    numeric: false,
    disablePadding: true,
    label: "Joined At",
  },
];

export interface ValuesFilterUsers {
  fullName: string;
  email: string;
  role: string;
  minimumDailyWage: string;
  maximumDailyWage: string;
  minimumCommission: string;
  maximumCommission: string;
  joinedAtFrom: string;
  joinedAtTo: string;
}

const initialFilters: ValuesFilterUsers = {
  fullName: "",
  email: "",
  role: "",
  minimumDailyWage: "",
  maximumDailyWage: "",
  minimumCommission: "",
  maximumCommission: "",
  joinedAtFrom: "",
  joinedAtTo: "",
};

export function useInvoices() {
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<ValuesFilterUsers>(initialFilters);
  const [searchValue, setSearchValue] = useState("");

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    let temp = { ...filters };
    temp.fullName = e.target.value;
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
        <TableCell sx={{ minWidth: 200 }}>{row.full_name}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{stripEmail(row.email)}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.role}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.daily_wage}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.commissions &&
            row.commissions.length > 0 &&
            (row.commissions.length > 1 ? (
              <Typography>
                Sales: {row.commissions[0]}%<br />
                Closing: {row.commissions[1]}%
              </Typography>
            ) : (
              `${row.commissions[0]}%`
            ))}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {getDateTimeFormatted(row.created_at, true)}
        </TableCell>
      </React.Fragment>
    );
  }

  function openDeleteConfirmModal() {
    setDeleteConfirmModalOpen(true);
  }

  async function onDelete() {}

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
      const profilesRepository = new ProfilesRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const profiles = await profilesRepository.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters
      );
      if (profiles) {
        const { profilesData, profilesCount, profilesError } = profiles;
        if (profilesData && !profilesError) {
          setData(profilesData);
          setDataCount(profilesCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching profiles:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters]);

  async function validateFilters(values: ValuesFilterUsers) {
    const errors = {} as ValuesFilterUsers;

    return errors;
  }

  async function handleFiltersSubmit(values: ValuesFilterUsers) {
    try {
      setFilters(values);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering profiles:", error);
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
    handleSearchDebounced,
    searchValue,
    setSearchValue,
  };
}
