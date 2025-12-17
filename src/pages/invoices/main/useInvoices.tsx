import { Checkbox, TableCell, Typography, useTheme } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { ValuesFilterInvoices } from "types";
import { SnackbarProps } from "types/snackbar";
import {
  getDateFormatted,
  initialRowsPerPage,
  useDebouncedSearch,
} from "utils/helpers";
import InvoicesRepository from "utils/repositories/invoicesRepository";

const headCells: HeadCell[] = [
  {
    id: "invoice_number",
    numeric: false,
    disablePadding: true,
    label: "Invoice Number",
  },
  {
    id: "customer",
    numeric: false,
    disablePadding: true,
    label: "Customer",
  },
  {
    id: "quotation",
    numeric: false,
    disablePadding: true,
    label: "Quotation",
  },
  {
    id: "total",
    numeric: true,
    disablePadding: true,
    label: "Total (A$)",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: true,
    label: "Status",
  },
  {
    id: "invoice_date",
    numeric: false,
    disablePadding: true,
    label: "Invoice Date",
  },
  {
    id: "items_count",
    numeric: true,
    disablePadding: true,
    label: "Items",
  },
  {
    id: "created_at",
    numeric: false,
    disablePadding: true,
    label: "Created Date",
  },
];

export const initialFilters: ValuesFilterInvoices = {
  invoice_number: "",
  customer_name: "",
  quotation_number: "",
  minimumTotal: "",
  maximumTotal: "",
  status: "",
  invoice_date_from: "",
  invoice_date_to: "",
  created_at_from: "",
  created_at_to: "",
  item_name: "",
  item_code: "",
};

export function useInvoices() {
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
  const [filters, setFilters] = useState<ValuesFilterInvoices>(initialFilters);
  const [searchValue, setSearchValue] = useState("");
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const navigate = useNavigate();
  const theme = useTheme();

  function goToCreate() {
    navigate("/invoices/create");
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    let temp = { ...filters };
    temp.invoice_number = e.target.value;
    temp.customer_name = e.target.value;
    setFilters(temp);
  }

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

  function generateTableCells(
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) {
    const itemsCount = row.invoice_items?.length || 0;
    
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
          sx={{ minWidth: 200 }}
          align="left"
        >
          {row.invoice_number}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.customer?.name}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {row.quotations?.quotation_number || "N/A"}
        </TableCell>
        <TableCell align="right" sx={{ minWidth: 150 }}>
          ${row.total?.toFixed(2)}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <Typography
            sx={{
              color:
                row.status === 'paid'
                  ? theme.palette.success.main
                  : row.status === 'sent'
                    ? theme.palette.info.main
                    : row.status === 'draft'
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
            }}
          >
            <FormattedMessage id={row.status} />
          </Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {row.invoice_date ? getDateFormatted(row.invoice_date) : "N/A"}
        </TableCell>
        <TableCell align="center" sx={{ minWidth: 100 }}>
          {itemsCount}
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {getDateFormatted(row.created_at)}
        </TableCell>
      </React.Fragment>
    );
  }

  function openDeleteConfirmModal() {
    setDeleteConfirmModalOpen(true);
  }

  async function onDelete() {
    const invoicesRepo = new InvoicesRepository();
    const deletedInvoices = await invoicesRepo.delete(selected);
    if (deletedInvoices > 0) {
      openSnackbar({
        open: true,
        message: `${deletedInvoices} invoice(s) deleted successfully.`,
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
        message: "Invoice(s) could not be deleted successfully. Please try again.",
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
      const invoicesRepo = new InvoicesRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const invoices = await invoicesRepo.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters
      );
      if (invoices) {
        const { invoicesData, invoicesCount, invoicesError } = invoices;
        if (invoicesData && !invoicesError) {
          setData(invoicesData);
          setDataCount(invoicesCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching invoices:", e);
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
          let invoice = data[i] as any;
          csvString += `${invoice.invoice_number ?? ""},${invoice.customer?.name ?? ""},${invoice.quotations?.quotation_number ?? ""},${invoice.total ?? ""},${invoice.status ?? ""},${invoice.invoice_date ? getDateFormatted(invoice.invoice_date) : ""},${invoice.invoice_items?.length || 0},${getDateFormatted(invoice.created_at)}\n`;
        }

        setCsvData(csvString);

        setTimeout(() => {
          csvLink?.current?.link?.click();
        }, 2000);
      }
    } catch (e) {
      console.error("Error generating CSV:", e);
    }
  }

  async function validateFilters(values: ValuesFilterInvoices) {
    const errors = {} as ValuesFilterInvoices;
    return errors;
  }

  async function handleFiltersSubmit(values: ValuesFilterInvoices) {
    try {
      setFilters(values);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering invoices:", error);
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