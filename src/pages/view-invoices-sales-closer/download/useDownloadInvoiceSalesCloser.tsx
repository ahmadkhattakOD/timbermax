import { TableCell, Typography } from "@mui/material";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useParams } from "react-router";
import {
  getDateFormatted,
  getDateTimeFormatted,
  initialRowsPerPage,
  isNumeric,
} from "utils/helpers";
import GeneratedInvoicesRepository from "utils/repositories/generatedInvoicesRepository";
import InvoicesRepository from "utils/repositories/invoicesRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";

const headCellsSales: HeadCell[] = [
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

export interface ValuesViewInvoice {
  wages: string;
  travelBonus: string;
  otherBonuses: string;
  deductions: string;
  totalCommission: string;
  cancelledSales: string;
}

export interface ValuesFilterSales {
  minimumCommission: string;
  maximumCommission: string;
  invoiceDateFrom: string;
  invoiceDateTo: string;
}

const initialFiltersSales: ValuesFilterSales = {
  minimumCommission: "",
  maximumCommission: "",
  invoiceDateFrom: "",
  invoiceDateTo: "",
};

export function useDownloadInvoiceSalesCloser() {
  const [dataSales, setDataSales] = useState<any[]>([]);
  const [dataCountSales, setDataCountSales] = useState<number>(0);
  const [orderSales, setOrderSales] = useState<Order>("desc");
  const [orderBySales, setOrderBySales] = useState<string>("created_at");
  const [selectedSales, setSelectedSales] = useState<readonly number[]>([]);
  const [pageSales, setPageSales] = useState(0);
  const [rowsPerPageSales, setRowsPerPageSales] = useState(initialRowsPerPage);
  const [loadingSales, setLoadingSales] = useState<boolean>(false);
  const [filterModalOpenSales, setFilterModalOpenSales] = useState(false);
  const [filtersSales, setFiltersSales] =
    useState<ValuesFilterSales>(initialFiltersSales);

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

  const [invoice, setInvoice] = useState<any>(null);
  const [fullName, setFullName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [grandTotal, setGrandTotal] = useState(0);
  const { id } = useParams();

  function generateTableCellsSales(
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
          {row.created_at && getDateFormatted(row.created_at)}
        </TableCell>
      </React.Fragment>
    );
  }

  async function getDataSales() {
    try {
      const profilesRepository = new ProfilesRepository();
      const currentUser = await profilesRepository.getCurrentUser();
      if (currentUser) {
        setLoadingSales(true);
        const invoicesRepository = new InvoicesRepository();
        const rangeStart = rowsPerPageSales * pageSales;
        const rangeEnd = rangeStart + rowsPerPageSales;
        const invoices = await invoicesRepository.getForSalesCloser(
          currentUser.id,
          orderBySales,
          orderSales === "asc",
          rangeStart,
          rangeEnd,
          rowsPerPageSales,
          invoice.start_date,
          invoice.end_date,
          filtersSales
        );
        if (invoices) {
          const { invoicesData, invoicesCount, invoicesError } = invoices;
          if (invoicesData && !invoicesError) {
            setDataSales(invoicesData);
            setDataCountSales(invoicesCount ?? 0);
          }
        }
        setLoadingSales(false);
      }
    } catch (e) {
      console.error("Error fetching invoices:", e);
      setLoadingSales(false);
    }
  }

  useEffect(() => {
    if (invoice) {
      getDataSales();
    }
  }, [
    orderSales,
    orderBySales,
    pageSales,
    rowsPerPageSales,
    filtersSales,
    invoice,
  ]);

  function openFilterModalSales() {
    setFilterModalOpenSales(true);
  }

  function closeFilterModalSales() {
    setFilterModalOpenSales(false);
  }

  async function validateFiltersSales(values: ValuesFilterSales) {
    const errors = {} as ValuesFilterSales;

    return errors;
  }

  async function handleFiltersSubmitSales(values: ValuesFilterSales) {
    try {
      setFiltersSales(values);
      setFilterModalOpenSales(false);
    } catch (error) {
      console.error("Error filtering invoices:", error);
    }
  }

  function resetFiltersSales() {
    setFiltersSales(initialFiltersSales);
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
          invoice.start_date,
          invoice.end_date
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
    if (invoice) {
      getDataCancelled();
    }
  }, [orderCancelled, orderByCancelled, pageCancelled, rowsPerPageCancelled]);

  async function getInvoiceProfile() {
    try {
      if (id && isNumeric(id)) {
        setLoading(true);
        const generatedInvoicesRepository = new GeneratedInvoicesRepository();
        const invoice = await generatedInvoicesRepository.getSingle(
          parseInt(id)
        );
        if (invoice) {
          const { invoiceData, invoiceError } = invoice;
          if (invoiceData && !invoiceError) {
            setInvoice(invoiceData);
            setGrandTotal(
              (invoiceData.wages ?? 0) +
                (invoiceData.travel_bonus ?? 0) +
                (invoiceData.other_bonuses ?? 0) +
                (invoiceData.total_commission ?? 0) -
                (invoiceData.cancelled_sales ?? 0) -
                (invoiceData.deductions ?? 0)
            );
          }
        }
        const profilesRepository = new ProfilesRepository();
        const currentUser = await profilesRepository.getCurrentUser();
        if (currentUser) {
          const profile = await profilesRepository.getSingle(currentUser.id);
          if (profile) {
            const { profileData, profileError } = profile;
            if (profileData && !profileError) {
              setFullName(profileData.full_name);
              setRole(profileData.role);
            }
          }
        }
        setLoading(false);
      }
    } catch (e) {
      console.error("Error fetching invoice:", e);
    }
  }

  useEffect(() => {
    getInvoiceProfile();
  }, []);

  function validate(values: ValuesViewInvoice) {
    const errors = {} as ValuesViewInvoice;

    return errors;
  }

  return {
    invoice,
    fullName,
    loading,
    validate,
    grandTotal,
    role,
    dataSales,
    dataCountSales,
    loadingSales,
    orderSales,
    setOrderSales,
    orderBySales,
    setOrderBySales,
    selectedSales,
    setSelectedSales,
    pageSales,
    setPageSales,
    rowsPerPageSales,
    setRowsPerPageSales,
    headCellsSales,
    generateTableCellsSales,
    filterModalOpenSales,
    openFilterModalSales,
    closeFilterModalSales,
    handleFiltersSubmitSales,
    validateFiltersSales,
    filtersSales,
    resetFiltersSales,
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
  };
}
