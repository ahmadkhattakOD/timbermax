import { Checkbox, TableCell } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  getDateFormatted,
  getDateTimeFormatted,
  initialRowsPerPage,
} from "utils/helpers";
import GeneratedInvoicesRepository, {
  GeneratedInvoiceSupabase,
} from "utils/repositories/generatedInvoicesRepository";
import InvoicesRepository from "utils/repositories/invoicesRepository";
import ProfilesRepository, {
  InvoiceRulesSupabase,
} from "utils/repositories/profilesRepository";
import SalesRepository from "utils/repositories/salesRepository";

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
    label: "Deposit",
  },
  {
    id: "total",
    numeric: true,
    disablePadding: true,
    label: "Total",
  },
  {
    id: "commission",
    numeric: true,
    disablePadding: true,
    label: "Commission",
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

export interface ValuesEditInvoice {
  showDays: string;
  travelBonus: string;
  otherBonuses: string;
  deductions: string;
  totalCommission: string;
  cancelledSales: string;
}

export interface ValuesSaleDates {
  saleDateFrom: string;
  saleDateTo: string;
}

export interface ValuesFilterInvoices {
  sale: string;
  minimumCommission: string;
  maximumCommission: string;
  invoiceDateFrom: string;
  invoiceDateTo: string;
}

const initialFilters: ValuesFilterInvoices = {
  sale: "",
  minimumCommission: "",
  maximumCommission: "",
  invoiceDateFrom: "",
  invoiceDateTo: "",
};

export function useCreateInvoice() {
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [wage, setWage] = useState<number>(0);
  const [profileDataLoading, setProfileDataLoading] = useState(true);
  const [cancelledSales, setCancelledSales] = useState<number>(0);
  const [totalCommission, setTotalCommission] = useState<number>(0);
  const [invoiceRules, setInvoiceRules] = useState<InvoiceRulesSupabase>({
    show_days: 0,
    travel_bonus: 0,
    other_bonuses: 0,
    deductions: 0,
  });
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [filters, setFilters] = useState<ValuesFilterInvoices>(initialFilters);
  const { id } = useParams();
  const [saleDateFrom, setSaleDateFrom] = useState("");
  const [saleDateTo, setSaleDateTo] = useState("");
  const navigate = useNavigate();

  function generateTableCells(
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) {
    return (
      <React.Fragment>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.contact_name}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.opportunity_description}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }} align="right">
          {row.sale?.deposit}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }} align="right">
          {row.sale?.total}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }} align="right">
          {row.commission}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.payment_method && (
            <FormattedMessage id={row.sale?.payment_method} />
          )}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.phone}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.address}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.state}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.post_code}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.email_address}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.sales_person && row.sale?.sales_person.full_name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.closer && row.sale?.closer.full_name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.show && row.sale?.show.name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.notes}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.status && <FormattedMessage id={row.sale?.status} />}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.follow_up_notes}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {getDateFormatted(row.sale?.sale_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.delivery_date_time &&
            getDateTimeFormatted(row.sale?.delivery_date_time, true)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.stock_from_warehouse?.name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.created_at && getDateFormatted(row.created_at)}
        </TableCell>
      </React.Fragment>
    );
  }

  function openFilterModal() {
    setFilterModalOpen(true);
  }

  function closeFilterModal() {
    setFilterModalOpen(false);
  }

  function validate(values: ValuesEditInvoice) {
    const errors = {} as ValuesEditInvoice;

    if (values.showDays !== "" && parseInt(values.showDays) < 0) {
      errors.showDays = "required-valid-number-positive";
    }

    if (values.travelBonus !== "" && parseInt(values.travelBonus) < 0) {
      errors.travelBonus = "required-valid-number-positive";
    }

    if (values.otherBonuses !== "" && parseInt(values.otherBonuses) < 0) {
      errors.otherBonuses = "required-valid-number-positive";
    }

    if (values.deductions !== "" && parseInt(values.deductions) < 0) {
      errors.deductions = "required-valid-number-positive";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditInvoice) {
    try {
      if (id) {
        const newGeneratedInvoice: GeneratedInvoiceSupabase = {
          start_date: new Date(saleDateFrom),
          end_date: new Date(saleDateTo),
          wages: (parseFloat(values.showDays) ?? 0) * wage,
          travel_bonus: parseFloat(values.travelBonus) ?? 0,
          other_bonuses: parseFloat(values.otherBonuses) ?? 0,
          total_commission: parseFloat(values.totalCommission) ?? 0,
          cancelled_sales: parseFloat(values.cancelledSales) ?? 0,
          deductions: parseFloat(values.deductions) ?? 0,
          status: "Pending",
          beneficiary: id,
        };

        const generatedInvoicesRepository = new GeneratedInvoicesRepository();
        const createdInvoice =
          await generatedInvoicesRepository.create(newGeneratedInvoice);

        if (createdInvoice) {
          openSnackbar({
            open: true,
            message: "Invoice generated successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Invoice could not be generated successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }
        navigate(`/invoices/users/${id}/view`);
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Invoice could not be generated successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      if (id) {
        navigate(`/invoices/users/${id}/view`);
      } else {
        navigate(`/invoices/users`);
      }
    }
  }

  async function getData() {
    try {
      if (id) {
        setLoading(true);
        const invoicesRepository = new InvoicesRepository();
        const rangeStart = rowsPerPage * page;
        const rangeEnd = rangeStart + rowsPerPage;
        const invoices = await invoicesRepository.get(
          id,
          orderBy,
          order === "asc",
          rangeStart,
          rangeEnd,
          rowsPerPage,
          saleDateFrom,
          saleDateTo,
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
      console.error("Error fetching invoices:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters, saleDateFrom, saleDateTo]);

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
    setFilters(initialFilters);
  }

  async function validateSaleDates(values: ValuesSaleDates) {
    const errors = {} as ValuesSaleDates;

    if (!values.saleDateFrom) {
      errors.saleDateFrom = "required";
    }

    if (!values.saleDateTo) {
      errors.saleDateTo = "required";
    }

    return errors;
  }

  async function handleSaleDatesSubmit(values: ValuesSaleDates) {
    try {
      setSaleDateFrom(values.saleDateFrom);
      setSaleDateTo(values.saleDateTo);
    } catch (error) {
      console.error("Error filtering invoices:", error);
    }
  }

  async function getProfileAndFigures() {
    try {
      if (id) {
        setProfileDataLoading(true);
        const profilesRepository = new ProfilesRepository();
        const profile = await profilesRepository.getSingle(id);
        if (profile) {
          const { profileData, profileError } = profile;
          if (profileData && !profileError) {
            setFullName(profileData.full_name);
            setProfilePicture(profileData.profile_picture);
            setWage(profileData.daily_wage ?? 0);
          }
        }
        const invoicesRepository = new InvoicesRepository();
        const allInvoices = await invoicesRepository.getWithExtendedLimit(
          id,
          saleDateFrom,
          saleDateTo
        );
        if (allInvoices) {
          const { invoicesData, invoicesError } = allInvoices;
          if (invoicesData && !invoicesError) {
            let salesCancelledValue = 0;
            let salesMadeValue = 0;
            for (let i = 0; i < invoicesData.length; i++) {
              let sale = invoicesData[i].sale as any;
              if (sale.status === "cancelled") {
                salesCancelledValue += invoicesData[i].commission;
              }
              salesMadeValue += invoicesData[i].commission;
            }

            setCancelledSales(salesCancelledValue);
            setTotalCommission(salesMadeValue);
            setGrandTotal(salesMadeValue - salesCancelledValue);
          }
        }
        setProfileDataLoading(false);
      }
    } catch (e) {
      console.error("Error fetching profile data:", e);
      setProfileDataLoading(false);
    }
  }

  async function getFilterData() {
    const salesRepository = new SalesRepository();
    const allSales = await salesRepository.getWithoutFilters();
    if (allSales) {
      const { salesData, salesError } = allSales;
      if (salesData && !salesError) {
        setSales(salesData);
      }
    }
  }

  useEffect(() => {
    getFilterData();
  }, []);

  useEffect(() => {
    getProfileAndFigures();
  }, [saleDateFrom, saleDateTo]);

  useEffect(() => {
    setGrandTotal(
      totalCommission +
        invoiceRules.show_days * wage +
        invoiceRules.travel_bonus +
        invoiceRules.other_bonuses -
        invoiceRules.deductions -
        cancelledSales
    );
  }, [invoiceRules, wage, totalCommission, cancelledSales]);

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
    validate,
    onSubmit,
    fullName,
    profilePicture,
    wage,
    totalCommission,
    cancelledSales,
    grandTotal,
    filterModalOpen,
    openFilterModal,
    closeFilterModal,
    handleFiltersSubmit,
    validateFilters,
    filters,
    sales,
    resetFilters,
    validateSaleDates,
    handleSaleDatesSubmit,
    profileDataLoading,
    invoiceRules,
    setInvoiceRules,
    saleDateFrom,
    saleDateTo,
  };
}
