import { Checkbox, TableCell } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  getDateFormatted,
  initialRowsPerPage,
  useDebouncedSearch,
} from "utils/helpers";
import CustomersRepository from "utils/repositories/customersRepository";

const headCells: HeadCell[] = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "Name",
  },
  {
    id: "milestone",
    numeric: false,
    disablePadding: true,
    label: "Milestone",
  },
  {
    id: "email",
    numeric: false,
    disablePadding: true,
    label: "Email",
  },
  {
    id: "phone",
    numeric: false,
    disablePadding: true,
    label: "Phone",
  },
  {
    id: "mobile",
    numeric: false,
    disablePadding: true,
    label: "Mobile",
  },
  {
    id: "expected_close_date",
    numeric: false,
    disablePadding: true,
    label: "Expected Close Date",
  },
  {
    id: "actual_close_date",
    numeric: false,
    disablePadding: true,
    label: "Actual Close Date",
  },
  {
    id: "address",
    numeric: false,
    disablePadding: true,
    label: "Address",
  },
  {
    id: "suburb",
    numeric: false,
    disablePadding: true,
    label: "Suburb",
  },
  {
    id: "state",
    numeric: false,
    disablePadding: true,
    label: "State",
  },
  {
    id: "post_code",
    numeric: false,
    disablePadding: true,
    label: "Post Code",
  },
  {
    id: "notes",
    numeric: false,
    disablePadding: true,
    label: "Notes",
  },
];

export interface ValuesFilterCustomers {
  name: string;
  milestone: string;
  email: string;
  phone: string;
  mobile: string;
  expectedCloseDateFrom: string;
  expectedCloseDateTo: string;
  actualCloseDateFrom: string;
  actualCloseDateTo: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
}

const initialFilters: ValuesFilterCustomers = {
  name: "",
  milestone: "",
  email: "",
  phone: "",
  mobile: "",
  expectedCloseDateFrom: "",
  expectedCloseDateTo: "",
  actualCloseDateFrom: "",
  actualCloseDateTo: "",
  address: "",
  suburb: "",
  state: "",
  postCode: "",
};

export function useCustomers() {
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
  const [filters, setFilters] = useState<ValuesFilterCustomers>(initialFilters);
  const [searchValue, setSearchValue] = useState("");
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const navigate = useNavigate();

  function goToCreate() {
    navigate("/customers/new");
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
        <TableCell sx={{ minWidth: 200 }}>{row.name}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.milestone && <FormattedMessage id={row.milestone} />}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.email}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.phone}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.mobile}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.expected_close_date && getDateFormatted(row.expected_close_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.actual_close_date && getDateFormatted(row.actual_close_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.address}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.suburb}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.state}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.post_code}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.notes}</TableCell>
      </React.Fragment>
    );
  }

  function openDeleteConfirmModal() {
    setDeleteConfirmModalOpen(true);
  }

  async function onDelete() {
    const customersRepository = new CustomersRepository();
    const deletedCustomers = await customersRepository.delete(selected);
    if (deletedCustomers > 0) {
      openSnackbar({
        open: true,
        message: `${deletedCustomers} customer(s) deleted successfully.`,
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
          "Customer(s) could not be deleted successfully. Please try again.",
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
      const customersRepository = new CustomersRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const customers = await customersRepository.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters
      );
      if (customers) {
        const { customersData, customersCount, customersError } = customers;
        if (customersData && !customersError) {
          setData(customersData);
          setDataCount(customersCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching customers:", e);
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
          let customer = data[i] as any;
          csvString += `${customer?.name ?? ""},${customer?.milestone ?? ""},${customer?.email ?? ""},${customer?.phone ?? ""},${customer?.expected_close_date ?? ""},${customer?.actual_close_date ?? ""},${customer?.address ?? ""},${customer?.suburb ?? ""},${customer?.state ?? ""},${customer?.post_code ?? ""},${customer?.notes ?? ""}\n`;
        }

        setCsvData(csvString);

        setTimeout(() => {
          csvLink?.current?.link?.click();
        }, 2000);
      }
    } catch (e) {
      console.error("Error fetching customers:", e);
      setLoading(false);
    }
  }

  async function validateFilters(values: ValuesFilterCustomers) {
    const errors = {} as ValuesFilterCustomers;

    return errors;
  }

  async function handleFiltersSubmit(values: ValuesFilterCustomers) {
    try {
      setFilters(values);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering customers:", error);
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
