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
import InvoicedSalesRepository from "utils/repositories/invoicedSalesRepository";
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

export function useDownloadInvoice() {
  const [invoice, setInvoice] = useState<any>(null);
  const [fullName, setFullName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [grandTotal, setGrandTotal] = useState(0);
  const { id, iid } = useParams();

  const [dataSales, setDataSales] = useState<any[]>([]);
  const [dataCountSales, setDataCountSales] = useState<number>(0);
  const [orderSales, setOrderSales] = useState<Order>("desc");
  const [orderBySales, setOrderBySales] = useState<string>("created_at");
  const [selectedSales, setSelectedSales] = useState<readonly number[]>([]);
  const [pageSales, setPageSales] = useState(0);
  const [rowsPerPageSales, setRowsPerPageSales] = useState(initialRowsPerPage);
  const [loadingSales, setLoadingSales] = useState<boolean>(false);

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

  function generateTableCellsSales(
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) {
    return (
      <React.Fragment>
        <TableCell sx={{ minWidth: 200 }}>{row.contact_name}</TableCell>
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
        <TableCell sx={{ minWidth: 200 }} align="right">
          {row.deposit}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }} align="right">
          {row.total}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }} align="right">
          {row.commission}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.payment_method && (
            <FormattedMessage id={row.payment_method} />
          )}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.phone}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.mobile}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.address}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.suburb}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.state}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.post_code}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.email_address}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sales_person?.full_name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.closer?.full_name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.show_name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.notes}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.status && <FormattedMessage id={row.status} />}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.follow_up_notes}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {getDateFormatted(row.sale_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.delivery_date_time &&
            getDateTimeFormatted(row.delivery_date_time, true)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.created_at && getDateFormatted(row.created_at)}
        </TableCell>
      </React.Fragment>
    );
  }

  async function getDataSales() {
    try {
      if (iid) {
        setLoadingSales(true);
        const invoicedSalesRepository = new InvoicedSalesRepository();
        const rangeStart = rowsPerPageSales * pageSales;
        const rangeEnd = rangeStart + rowsPerPageSales;
        const sales = await invoicedSalesRepository.getInvoicable(
          parseInt(iid),
          orderBySales,
          orderSales === "asc",
          rangeStart,
          rangeEnd,
          rowsPerPageSales,
        );
        if (sales) {
          const { salesData, salesCount, salesError } = sales;
          if (salesData && !salesError) {
            setDataSales(salesData);
            setDataCountSales(salesCount ?? 0);
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
  }, [orderSales, orderBySales, pageSales, rowsPerPageSales, invoice]);

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
          {row.contact_name}
        </TableCell>
        <TableCell align="right" sx={{ minWidth: 200 }}>
          {row.deposit}
        </TableCell>
        <TableCell align="right">{row.total}</TableCell>
        <TableCell align="right">{row.commission}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.sale_date && getDateFormatted(row.sale_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.status_changed_at &&
            getDateFormatted(row.status_changed_at)}
        </TableCell>
      </React.Fragment>
    );
  }

  async function getDataCancelled() {
    try {
      if (iid) {
        setLoadingCancelled(true);
        const invoicedSalesRepository = new InvoicedSalesRepository();
        const rangeStart = rowsPerPageCancelled * pageCancelled;
        const rangeEnd = rangeStart + rowsPerPageCancelled;
        const sales = await invoicedSalesRepository.getCancelled(
          parseInt(iid),
          orderByCancelled,
          orderCancelled === "asc",
          rangeStart,
          rangeEnd,
          rowsPerPageCancelled,
        );
        if (sales) {
          const { salesData, salesCount, salesError } = sales;
          if (salesData && !salesError) {
            setDataCancelled(salesData);
            setDataCountCancelled(salesCount ?? 0);
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
  }, [orderCancelled, orderByCancelled, pageCancelled, rowsPerPageCancelled, invoice]);

  async function getInvoiceProfile() {
    try {
      if (id && iid && isNumeric(iid)) {
        setLoading(true);
        const generatedInvoicesRepository = new GeneratedInvoicesRepository();
        const invoice = await generatedInvoicesRepository.getSingle(
          parseInt(iid)
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
        const profile = await profilesRepository.getSingle(id);
        if (profile) {
          const { profileData, profileError } = profile;
          if (profileData && !profileError) {
            setFullName(profileData.full_name);
            setRole(profileData.role);
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
