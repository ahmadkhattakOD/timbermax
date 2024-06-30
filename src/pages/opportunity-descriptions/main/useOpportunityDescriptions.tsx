import { Checkbox, TableCell } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { initialRowsPerPage } from "utils/helpers";
import OpportunityDescriptionsRepository from "utils/repositories/opportunityDescriptionsRepository";

const headCells: HeadCell[] = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "Name",
  },
  {
    id: "description",
    numeric: false,
    disablePadding: true,
    label: "Description",
  },
];

export interface ValuesFilterOpportunityDescriptions {
  name: string;
  description: string;
}

const initialFilters: ValuesFilterOpportunityDescriptions = {
  name: "",
  description: "",
};

export function useOpportunityDescriptions() {
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
  const [filters, setFilters] =
    useState<ValuesFilterOpportunityDescriptions>(initialFilters);
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const navigate = useNavigate();

  function goToCreate() {
    navigate("/opportunity-descriptions/new");
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
          sx={{ minWidth: 200 }}
          align="left"
        >
          {row.name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.description}</TableCell>
      </React.Fragment>
    );
  }

  function openDeleteConfirmModal() {
    setDeleteConfirmModalOpen(true);
  }

  async function onDelete() {
    const opportunityDescriptionsRepository =
      new OpportunityDescriptionsRepository();
    const deletedOpportunities =
      await opportunityDescriptionsRepository.delete(selected);
    if (deletedOpportunities > 0) {
      openSnackbar({
        open: true,
        message: `${deletedOpportunities} opportunity description(s) deleted successfully.`,
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
          "Opportunity description(s) could not be deleted successfully. Please try again.",
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
      const opportunityDescriptionsRepository =
        new OpportunityDescriptionsRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const opportunities = await opportunityDescriptionsRepository.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters
      );
      if (opportunities) {
        const { opportunitiesData, opportunitiesCount, opportunitiesError } =
          opportunities;
        if (opportunitiesData && !opportunitiesError) {
          setData(opportunitiesData);
          setDataCount(opportunitiesCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching opportunity descriptions:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters]);

  async function getDataCsv() {
    try {
      const opportunityDescriptionsRepository =
        new OpportunityDescriptionsRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const opportunities = await opportunityDescriptionsRepository.getCsv(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters
      );
      if (opportunities) {
        const { opportunitiesData, opportunitiesError } =
          opportunities;
        if (opportunitiesData && !opportunitiesError) {
          setCsvData(opportunitiesData);
          if (opportunitiesData.length > 0) {
            setTimeout(() => {
              csvLink?.current?.link?.click();
            }, 2000);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching opportunity descriptions:", e);
      setLoading(false);
    }
  }

  async function validateFilters(values: ValuesFilterOpportunityDescriptions) {
    const errors = {} as ValuesFilterOpportunityDescriptions;

    return errors;
  }

  async function handleFiltersSubmit(
    values: ValuesFilterOpportunityDescriptions
  ) {
    try {
      setFilters(values);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering opportunity descriptions:", error);
    }
  }

  function resetFilters() {
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
  };
}
