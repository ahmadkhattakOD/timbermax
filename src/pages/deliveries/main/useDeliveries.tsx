import { Typography } from "@mui/material";
import { Checkbox, TableCell } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  UserRoles,
  getDateFormatted,
  getDateTimeFormatted,
  initialRowsPerPage,
} from "utils/helpers";
import OpportunityDescriptionsRepository from "utils/repositories/opportunityDescriptionsRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";
import SalesRepository from "utils/repositories/salesRepository";
import ShowsRepository from "utils/repositories/showsRepository";

const headCells: HeadCell[] = [
  {
    id: "contact_name",
    numeric: false,
    disablePadding: true,
    label: "Contact Name",
  },
  {
    id: "opportunity_description",
    numeric: false,
    disablePadding: true,
    label: "Opportunity Description",
  },
  {
    id: "deposit",
    numeric: true,
    disablePadding: true,
    label: "Deposit (A$)",
  },
  {
    id: "total",
    numeric: true,
    disablePadding: true,
    label: "Total (A$)",
  },
  {
    id: "payment_method",
    numeric: false,
    disablePadding: true,
    label: "Payment Method",
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
    id: "address",
    numeric: false,
    disablePadding: true,
    label: "Address",
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
    id: "email_address",
    numeric: false,
    disablePadding: true,
    label: "Email Address",
  },
  {
    id: "sales_person",
    numeric: false,
    disablePadding: true,
    label: "Sales Person",
  },
  {
    id: "closer",
    numeric: false,
    disablePadding: true,
    label: "Closer",
  },
  {
    id: "show",
    numeric: false,
    disablePadding: true,
    label: "Show",
  },
  {
    id: "note",
    numeric: false,
    disablePadding: true,
    label: "Note",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: true,
    label: "Status",
  },
  {
    id: "follow_up_notes",
    numeric: false,
    disablePadding: true,
    label: "Follow-up Notes",
  },
  {
    id: "sale_date",
    numeric: false,
    disablePadding: true,
    label: "Sale Date",
  },
  {
    id: "delivery_date_time",
    numeric: false,
    disablePadding: true,
    label: "Delivery Date Time",
  },
  {
    id: "stock_from_warehouse",
    numeric: false,
    disablePadding: true,
    label: "Stock from Warehouse",
  },
  {
    id: "invoice_date",
    numeric: false,
    disablePadding: true,
    label: "Invoice Date",
  },
];

export interface ValuesFilterDeliveries {
  contactName: string;
  salesPerson: string;
  minimumDeposit: string;
  maximumDeposit: string;
  minimumTotal: string;
  maximumTotal: string;
  paymentMethod: string;
  phone: string;
  address: string;
  state: string;
  postCode: string;
  emailAddress: string;
  opportunityDescription: string;
  closer: string;
  show: string;
  saleDateFrom: string;
  saleDateTo: string;
}

const initialFilters: ValuesFilterDeliveries = {
  contactName: "",
  salesPerson: "",
  minimumDeposit: "",
  maximumDeposit: "",
  minimumTotal: "",
  maximumTotal: "",
  paymentMethod: "",
  phone: "",
  address: "",
  state: "",
  postCode: "",
  emailAddress: "",
  opportunityDescription: "",
  closer: "",
  show: "",
  saleDateFrom: "",
  saleDateTo: "",
};

export function useDeliveries() {
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
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [closers, setClosers] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [filters, setFilters] =
    useState<ValuesFilterDeliveries>(initialFilters);
  const navigate = useNavigate();

  function goToCreate() {
    navigate("/deliveries/new");
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
          {row.contact_name}
        </TableCell>
        <TableCell sx={{ minWidth: 500 }}>
          {row.opportunity_descriptions &&
            row.opportunity_descriptions.map(
              (opportunity: string, idx: number) => (
                <Typography key={idx}>
                  - {opportunity} <br />
                </Typography>
              )
            )}
        </TableCell>
        <TableCell align="right" sx={{ minWidth: 200 }}>
          {row.deposit}
        </TableCell>
        <TableCell align="right" sx={{ minWidth: 200 }}>
          {row.total}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.payment_method && <FormattedMessage id={row.payment_method} />}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.phone}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.mobile}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.address}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.state}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.post_code}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.email_address}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sales_person && row.sales_person.full_name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.closer && row.closer.full_name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.show && row.show.name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.notes}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.status && <FormattedMessage id={row.status} />}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.follow_up_notes}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale_date && getDateFormatted(row.sale_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.delivery_date_time &&
            getDateTimeFormatted(row.delivery_date_time, true)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.stock_from_warehouse?.name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.invoice_date && getDateFormatted(row.invoice_date)}
        </TableCell>
      </React.Fragment>
    );
  }

  function openDeleteConfirmModal() {
    setDeleteConfirmModalOpen(true);
  }

  async function onDelete() {
    const salesRepository = new SalesRepository();
    const deletedSales = await salesRepository.delete(selected);
    if (deletedSales > 0) {
      openSnackbar({
        open: true,
        message: `${deletedSales} sale(s) deleted successfully.`,
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
        message: "Sale(s) could not be deleted successfully. Please try again.",
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
      const salesRepository = new SalesRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const sales = await salesRepository.getDelivered(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage
      );
      if (sales) {
        const { salesData, salesCount, salesError } = sales;
        if (salesData && !salesError) {
          setData(salesData);
          setDataCount(salesCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching sales:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters]);

  async function validateFilters(values: ValuesFilterDeliveries) {
    const errors = {} as ValuesFilterDeliveries;

    return errors;
  }

  async function handleFiltersSubmit(values: ValuesFilterDeliveries) {
    try {
      setFilters(values);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering deliveries:", error);
    }
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  async function getFilterData() {
    const profilesRepository = new ProfilesRepository();
    const allProfiles = await profilesRepository.getWithoutFilters();
    if (allProfiles) {
      const { profilesData, profilesError } = allProfiles;
      if (profilesData && !profilesError) {
        let temp = [];
        let temp2 = [];
        for (let i = 0; i < profilesData.length; i++) {
          if (
            profilesData[i].role === UserRoles.SalesPerson ||
            profilesData[i].role === UserRoles.Both
          ) {
            temp.push(profilesData[i]);
          }
          if (
            profilesData[i].role === UserRoles.Closer ||
            profilesData[i].role === UserRoles.Both
          ) {
            temp2.push(profilesData[i]);
          }
        }
        setSalesPersons(temp);
        setClosers(temp2);
      }
    }
    const showsRepository = new ShowsRepository();
    const allShows = await showsRepository.getWithoutFilters();
    if (allShows) {
      const { showsData, showsError } = allShows;
      if (showsData && !showsError) {
        setShows(showsData);
      }
    }
    const opportunityDescriptionsRepository =
      new OpportunityDescriptionsRepository();
    const allOpportunities =
      await opportunityDescriptionsRepository.getWithoutFilters();
    if (allOpportunities) {
      const { opportunitiesData, opportunitiesError } = allOpportunities;
      if (opportunitiesData && !opportunitiesError) {
        setOpportunities(opportunitiesData);
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
    salesPersons,
    closers,
    shows,
    opportunities,
    resetFilters,
  };
}
