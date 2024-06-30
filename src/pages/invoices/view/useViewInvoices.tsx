import { Checkbox, TableCell } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  getDateFormatted,
  getDateTimeFormatted,
  initialRowsPerPage,
} from "utils/helpers";
import GeneratedInvoicesRepository from "utils/repositories/generatedInvoicesRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";

const headCells: HeadCell[] = [
  {
    id: "start_date",
    numeric: false,
    disablePadding: true,
    label: "Start Date",
  },
  {
    id: "end_date",
    numeric: false,
    disablePadding: true,
    label: "End Date",
  },
  {
    id: "total",
    numeric: true,
    disablePadding: true,
    label: "Total (A$)",
  },
  {
    id: "wages",
    numeric: true,
    disablePadding: true,
    label: "Wages (A$)",
  },
  {
    id: "travel_bonus",
    numeric: true,
    disablePadding: true,
    label: "Travel Bonus (A$)",
  },
  {
    id: "other_bonuses",
    numeric: true,
    disablePadding: true,
    label: "Other Bonuses (A$)",
  },
  {
    id: "total_commission",
    numeric: true,
    disablePadding: true,
    label: "Total Commission (A$)",
  },
  {
    id: "cancelled_sales",
    numeric: true,
    disablePadding: true,
    label: "Cancelled Sales (A$)",
  },
  {
    id: "deductions",
    numeric: true,
    disablePadding: true,
    label: "Deductions (A$)",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: true,
    label: "Status",
  },
  {
    id: "created_at",
    numeric: false,
    disablePadding: true,
    label: "Generated At",
  },
];

export interface ValuesFilterGeneratedInvoices {
  startDateFrom: string;
  startDateTo: string;
  endDateFrom: string;
  endDateTo: string;
  minimumWages: string;
  maximumWages: string;
  minimumTravelBonus: string;
  maximumTravelBonus: string;
  minimumOtherBonuses: string;
  maximumOtherBonuses: string;
  minimumTotalCommission: string;
  maximumTotalCommission: string;
  minimumCancelledSales: string;
  maximumCancelledSales: string;
  minimumDeductions: string;
  maximumDeductions: string;
  status: string;
  generatedAtFrom: string;
  generatedAtTo: string;
}

const initialFilters: ValuesFilterGeneratedInvoices = {
  startDateFrom: "",
  startDateTo: "",
  endDateFrom: "",
  endDateTo: "",
  minimumWages: "",
  maximumWages: "",
  minimumTravelBonus: "",
  maximumTravelBonus: "",
  minimumOtherBonuses: "",
  maximumOtherBonuses: "",
  minimumTotalCommission: "",
  maximumTotalCommission: "",
  minimumCancelledSales: "",
  maximumCancelledSales: "",
  minimumDeductions: "",
  maximumDeductions: "",
  status: "",
  generatedAtFrom: "",
  generatedAtTo: "",
};

export function useViewInvoices() {
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] =
    useState<ValuesFilterGeneratedInvoices>(initialFilters);
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const { id } = useParams();
  const navigate = useNavigate();

  function goToCreate() {
    navigate(`new`);
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
        <TableCell sx={{ minWidth: 200 }}>
          {row.start_date && getDateFormatted(row.start_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.end_date && getDateFormatted(row.end_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200, textAlign: "right" }}>
          {row.wages +
            row.travel_bonus +
            row.other_bonuses +
            row.total_commission -
            row.cancelled_sales -
            row.deductions}
        </TableCell>
        <TableCell sx={{ minWidth: 200, textAlign: "right" }}>
          {row.wages}
        </TableCell>
        <TableCell sx={{ minWidth: 200, textAlign: "right" }}>
          {row.travel_bonus}
        </TableCell>
        <TableCell sx={{ minWidth: 200, textAlign: "right" }}>
          {row.other_bonuses}
        </TableCell>
        <TableCell sx={{ minWidth: 200, textAlign: "right" }}>
          {row.total_commission}
        </TableCell>
        <TableCell sx={{ minWidth: 200, textAlign: "right" }}>
          {row.cancelled_sales}
        </TableCell>
        <TableCell sx={{ minWidth: 200, textAlign: "right" }}>
          {row.deductions}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          <FormattedMessage id={row.status} />
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

  async function onDelete() {
    const generatedInvoicesRepository = new GeneratedInvoicesRepository();
    const deletedInvoices = await generatedInvoicesRepository.delete(selected);
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
        message:
          "Invoice(s) could not be deleted successfully. Please try again.",
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
      if (id) {
        setLoading(true);
        const generatedInvoicesRepository = new GeneratedInvoicesRepository();
        const rangeStart = rowsPerPage * page;
        const rangeEnd = rangeStart + rowsPerPage;
        const invoices = await generatedInvoicesRepository.get(
          id,
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
      }
    } catch (e) {
      console.error("Error fetching profiles:", e);
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
          csvString += `${invoice?.start_date ?? ""},${invoice?.end_date ?? ""},${
            invoice?.wages +
              invoice?.travel_bonus +
              invoice?.other_bonuses +
              invoice?.total_commission -
              invoice?.cancelled_sales -
              invoice?.deductions ?? ""
          },${invoice?.wages ?? ""},${invoice?.travel_bonus ?? ""},${invoice?.other_bonuses ?? ""},${invoice?.total_commission ?? ""},${invoice?.cancelled_sales ?? ""},${invoice?.deductions ?? ""},${invoice?.status ?? ""},${invoice?.created_at}\n`;
        }

        setCsvData(csvString);

        setTimeout(() => {
          csvLink?.current?.link?.click();
        }, 2000);
      }
    } catch (e) {
      console.error("Error fetching invoices:", e);
      setLoading(false);
    }
  }

  async function validateFilters(values: ValuesFilterGeneratedInvoices) {
    const errors = {} as ValuesFilterGeneratedInvoices;

    return errors;
  }

  async function handleFiltersSubmit(values: ValuesFilterGeneratedInvoices) {
    try {
      setFilters(values);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering profiles:", error);
    }
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  async function markSelectedAsPaid() {
    const generatedInvoicesRepository = new GeneratedInvoicesRepository();
    const updatedInvoices = await generatedInvoicesRepository.changeBulkStatus(
      selected,
      "paid"
    );
    if (updatedInvoices > 0) {
      openSnackbar({
        open: true,
        message: `${updatedInvoices} invoice(s) updated successfully.`,
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
          "Invoice(s) could not be updated successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
  }

  async function markSelectedAsPending() {
    const generatedInvoicesRepository = new GeneratedInvoicesRepository();
    const updatedInvoices = await generatedInvoicesRepository.changeBulkStatus(
      selected,
      "pending"
    );
    if (updatedInvoices > 0) {
      openSnackbar({
        open: true,
        message: `${updatedInvoices} invoice(s) updated successfully.`,
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
          "Invoice(s) could not be updated successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
  }

  async function getProfile() {
    try {
      if (id) {
        const profilesRepository = new ProfilesRepository();
        const profile = await profilesRepository.getSingle(id);
        if (profile) {
          const { profileData, profileError } = profile;
          if (profileData && !profileError) {
            setFullName(profileData.full_name);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching profile data:", e);
    }
  }

  useEffect(() => {
    getProfile();
  }, []);

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
    fullName,
    markSelectedAsPaid,
    markSelectedAsPending,
    getDataCsv,
    csvData,
    csvLink,
  };
}
