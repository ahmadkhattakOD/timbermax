import { Typography } from "@mui/material";
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

const headCellsCancelled: HeadCell[] = [
  {
    id: "contact_name",
    numeric: false,
    disablePadding: true,
    label: "Contact Name",
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
    id: "commission",
    numeric: true,
    disablePadding: true,
    label: "Commission (A$)",
  },
  {
    id: "sale_date",
    numeric: false,
    disablePadding: true,
    label: "Sale Date",
  },
  {
    id: "status_changed_at",
    numeric: false,
    disablePadding: true,
    label: "Cancellation Date",
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

export interface ValuesFilterCancelled {
  sale: string;
  minimumCommission: string;
  maximumCommission: string;
  cancelledDateFrom: string;
  cancelledDateTo: string;
}

const initialFiltersCancelled: ValuesFilterCancelled = {
  sale: "",
  minimumCommission: "",
  maximumCommission: "",
  cancelledDateFrom: "",
  cancelledDateTo: "",
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
  const [alreadyCreatedInvoice, setAlreadyCreatedInvoice] = useState<any>(null);
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const [dataCancelled, setDataCancelled] = useState<any[]>([]);
  const [dataCountCancelled, setDataCountCancelled] = useState<number>(0);
  const [orderCancelled, setOrderCancelled] = useState<Order>("desc");
  const [orderByCancelled, setOrderByCancelled] =
    useState<string>("created_at");
  const [selectedCancelled, setSelectedCancelled] = useState<readonly number[]>(
    []
  );
  const [pageCancelled, setPageCancelled] = useState(0);
  const [rowsPerPageCancelled, setRowsPerPageCancelled] =
    useState(initialRowsPerPage);
  const [loadingCancelled, setLoadingCancelled] = useState<boolean>(false);
  const [filterModalOpenCancelled, setFilterModalOpenCancelled] =
    useState(false);
  const [filtersCancelled, setFiltersCancelled] =
    useState<ValuesFilterCancelled>(initialFiltersCancelled);
  const [csvDataCancelled, setCsvDataCancelled] = useState<string>("");
  const csvLinkCancelled = useRef<any>();
  const navigate = useNavigate();

  function generateTableCells(
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) {
    return (
      <React.Fragment>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.contact_name}</TableCell>
        <TableCell sx={{ minWidth: 500 }}>
          {row.sale?.opportunity_descriptions &&
            row.sale?.opportunity_descriptions.map(
              (opportunity: string, idx: number) => (
                <Typography key={idx}>
                  - {opportunity} <br />
                </Typography>
              )
            )}
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
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.mobile}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.address}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.sale?.suburb}</TableCell>
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
          wages:
            parseFloat(values.showDays !== "" ? values.showDays : "0") * wage,
          travel_bonus:
            parseFloat(values.travelBonus !== "" ? values.travelBonus : "0") ??
            0,
          other_bonuses: parseFloat(
            values.otherBonuses !== "" ? values.otherBonuses : "0"
          ),
          total_commission: parseFloat(
            values.totalCommission !== "" ? values.totalCommission : "0"
          ),
          cancelled_sales: parseFloat(
            values.cancelledSales !== "" ? values.cancelledSales : "0"
          ),
          deductions: parseFloat(
            values.deductions !== "" ? values.deductions : "0"
          ),
          status: "pending",
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

  function getDataCsv() {
    try {
      let csvString = "";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let invoice = data[i] as any;
          let opportunityDescriptions = "";
          if (invoice?.sale?.opportunity_descriptions) {
            invoice?.sale?.opportunity_descriptions.forEach(
              (opportunity: string) => {
                opportunityDescriptions += opportunity + " ";
              }
            );
          }
          csvString += `${invoice.sale?.contact_name ?? ""},${opportunityDescriptions},${invoice.sale?.deposit ?? ""},${invoice.sale?.total ?? ""},${invoice.commission ?? ""},${invoice.sale?.payment_method ?? ""},${invoice.sale?.phone ?? ""},${invoice.sale?.mobile ?? ""},${invoice.sale?.address ?? ""},${invoice.sale?.state ?? ""},${invoice.sale?.post_code ?? ""},${invoice.sale?.email_address ?? ""},${invoice.sale?.sales_person?.full_name ?? ""},${invoice.sale?.closer?.full_name ?? ""},${invoice.sale?.show?.name ?? ""},${invoice.sale?.note ?? ""},${invoice.sale?.status ?? ""},${invoice.sale?.follow_up_notes ?? ""},${invoice.sale?.sale_date ?? ""},${invoice.sale?.delivery_date_time ?? ""},${invoice.sale?.stock_from_warehose?.name ?? ""},${invoice.sale?.invoice_date ?? ""}\n`;
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

  function generateTableCellsCancelled(
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) {
    return (
      <React.Fragment>
        <TableCell
          component="th"
          id={labelId}
          scope="row"
          padding="none"
          width={200}
          align="left"
        >
          {row.sale?.contact_name}
        </TableCell>
        <TableCell align="right" sx={{ minWidth: 200 }}>
          {row.sale?.deposit}
        </TableCell>
        <TableCell align="right">{row.sale?.total}</TableCell>
        <TableCell align="right">{row.commission}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.sale_date && getDateFormatted(row.sale?.sale_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale?.status_changed_at &&
            getDateFormatted(row.sale?.status_changed_at)}
        </TableCell>
      </React.Fragment>
    );
  }

  async function getDataCancelled() {
    try {
      const profilesRepository = new ProfilesRepository();
      const currentUser = await profilesRepository.getCurrentUser();
      if (currentUser) {
        setLoadingCancelled(true);
        const invoicesRepository = new InvoicesRepository();
        const rangeStart = rowsPerPageCancelled * pageCancelled;
        const rangeEnd = rangeStart + rowsPerPageCancelled;
        const invoices = await invoicesRepository.getCancelled(
          currentUser.id,
          orderByCancelled,
          orderCancelled === "asc",
          rangeStart,
          rangeEnd,
          rowsPerPageCancelled,
          saleDateFrom,
          saleDateTo,
          filtersCancelled
        );
        if (invoices) {
          const { invoicesData, invoicesCount, invoicesError } = invoices;
          if (invoicesData && !invoicesError) {
            setDataCancelled(invoicesData);
            setDataCountCancelled(invoicesCount ?? 0);
          }
        }
        setLoadingCancelled(false);
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching sales:", e);
      setLoadingCancelled(false);
    }
  }

  useEffect(() => {
    getDataCancelled();
  }, [
    orderCancelled,
    orderByCancelled,
    pageCancelled,
    rowsPerPageCancelled,
    filtersCancelled,
    saleDateFrom,
    saleDateTo,
  ]);

  function getDataCsvCancelled() {
    try {
      let csvString = "";

      if (dataCancelled.length > 0) {
        for (let i = 0; i < dataCancelled.length; i++) {
          let invoice = dataCancelled[i] as any;
          csvString += `${invoice.sale?.contact_name ?? ""},${invoice.sale?.deposit ?? ""},${invoice.sale?.total ?? ""},${invoice.commission ?? ""},${invoice.sale?.sale_date ?? ""},${invoice.sale?.status_changed_at ?? ""}\n`;
        }

        setCsvDataCancelled(csvString);

        setTimeout(() => {
          csvLinkCancelled?.current?.link?.click();
        }, 2000);
      }
    } catch (e) {
      console.error("Error fetching invoices:", e);
      setLoading(false);
    }
  }

  function openFilterModalCancelled() {
    setFilterModalOpenCancelled(true);
  }

  function closeFilterModalCancelled() {
    setFilterModalOpenCancelled(false);
  }

  async function validateFiltersCancelled(values: ValuesFilterCancelled) {
    const errors = {} as ValuesFilterCancelled;

    return errors;
  }

  async function handleFiltersSubmitCancelled(values: ValuesFilterCancelled) {
    try {
      setFiltersCancelled(values);
      setFilterModalOpenCancelled(false);
    } catch (error) {
      console.error("Error filtering invoices:", error);
    }
  }

  function resetFiltersCancelled() {
    setFiltersCancelled(initialFiltersCancelled);
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
      setAlreadyCreatedInvoice(null);
      setSaleDateFrom(values.saleDateFrom);
      setSaleDateTo(values.saleDateTo);
      if (id) {
        const generatedInvoicesRepository = new GeneratedInvoicesRepository();
        const alreadyCreatedForDates =
          await generatedInvoicesRepository.checkExistence(
            id,
            values.saleDateFrom,
            values.saleDateTo
          );

        if (alreadyCreatedForDates) {
          const { invoiceData, invoiceError } = alreadyCreatedForDates;
          if (invoiceData && !invoiceError) {
            setAlreadyCreatedInvoice(invoiceData);
          }
        } else {
          setAlreadyCreatedInvoice(null);
        }
      }
    } catch (error) {
      console.error("Error setting dates:", error);
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
        let salesMadeValue = 0;
        let salesProcessed: string[] = [];
        if (allInvoices) {
          const { invoicesData, invoicesError } = allInvoices;
          if (invoicesData && !invoicesError) {
            for (let i = 0; i < invoicesData.length; i++) {
              let sale = invoicesData[i].sale as any;
              salesMadeValue += invoicesData[i].commission;
              // if (!salesProcessed.includes(sale.id)) {
              //   salesMadeValue -= 300;
              // }
              salesProcessed.push(sale.id);
            }
            setTotalCommission(salesMadeValue);
          }
        }
        let salesCancelledValue = 0;
        const allCancelledInvoices =
          await invoicesRepository.getCancelledWithExtendedLimit(
            id,
            saleDateFrom,
            saleDateTo
          );
        if (allCancelledInvoices) {
          const { invoicesData, invoicesError } = allCancelledInvoices;
          if (invoicesData && !invoicesError) {
            for (let i = 0; i < invoicesData?.length; i++) {
              salesCancelledValue += invoicesData[i].commission;
            }
            setCancelledSales(salesCancelledValue);
          }
        }
        setGrandTotal(salesMadeValue - salesCancelledValue);

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
    alreadyCreatedInvoice,
    getDataCsv,
    csvData,
    csvLink,
    filterModalOpenCancelled,
    openFilterModalCancelled,
    closeFilterModalCancelled,
    handleFiltersSubmitCancelled,
    validateFiltersCancelled,
    filtersCancelled,
    resetFiltersCancelled,
    dataCancelled,
    dataCountCancelled,
    loadingCancelled,
    orderCancelled,
    setOrderCancelled,
    orderByCancelled,
    setOrderByCancelled,
    selectedCancelled,
    setSelectedCancelled,
    pageCancelled,
    setPageCancelled,
    rowsPerPageCancelled,
    setRowsPerPageCancelled,
    headCellsCancelled,
    generateTableCellsCancelled,
    getDataCsvCancelled,
    csvDataCancelled,
    csvLinkCancelled,
  };
}
