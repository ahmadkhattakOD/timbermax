import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import { FormikHelpers } from "formik";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  UserRoles,
  getDateFormatted,
  initialRowsPerPage,
  isNumeric,
} from "utils/helpers";
import ProfilesRepository from "utils/repositories/profilesRepository";
import SalesRepository from "utils/repositories/salesRepository";
import ShowsRepository from "utils/repositories/showsRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";
import { TableCell } from "@mui/material";
import { FormattedMessage } from "react-intl";
import InvoicesRepository from "utils/repositories/invoicesRepository";
import OpportunityDescriptionsRepository from "utils/repositories/opportunityDescriptionsRepository";
import { Typography } from "@mui/material";

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
    id: "beneficiary",
    numeric: false,
    disablePadding: true,
    label: "Beneficiary",
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
];

export interface ValuesViewDelivery {
  contactName: string;
  opportunityDescription: string;
  deposit: string;
  total: string;
  paymentMethod: string;
  phone: string;
  address: string;
  state: string;
  postCode: string;
  emailAddress: string;
  note: string;
  salesPerson: string;
  closer: string;
  status: string;
  show: string;
  followUpNotes: string;
  saleDate: string;
  deliveryDateTime: string;
  stockFromWarehouse: string;
  invoiceDate: string;
}

export function useViewDelivery() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [closers, setClosers] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [sale, setSale] = useState<any>(null);
  const { id } = useParams();
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

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
          {row.beneficiary?.full_name}
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
      </React.Fragment>
    );
  }

  async function getData() {
    try {
      if (id && isNumeric(id)) {
        setLoading(true);
        const invoicesRepository = new InvoicesRepository();
        const rangeStart = rowsPerPage * page;
        const rangeEnd = rangeStart + rowsPerPage;
        const invoices = await invoicesRepository.getBySale(
          parseInt(id),
          orderBy,
          order === "asc",
          rangeStart,
          rangeEnd,
          rowsPerPage
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

  function validate(values: ValuesViewDelivery) {
    const errors = {} as ValuesViewDelivery;

    if (!values.contactName.trim()) {
      errors.contactName = "required";
    }

    if (!values.salesPerson.trim()) {
      errors.salesPerson = "required";
    }

    if (!values.deposit || parseFloat(values.deposit) <= 0) {
      errors.deposit = "required-valid-number";
    }

    if (!values.total || parseFloat(values.total) <= 0) {
      errors.total = "required-valid-number";
    }

    if (!values.paymentMethod.trim()) {
      errors.paymentMethod = "required";
    }

    if (!values.closer.trim()) {
      errors.closer = "required";
    }

    if (!values.status.trim()) {
      errors.status = "required";
    }

    if (!values.show) {
      errors.show = "required";
    }

    if (!values.saleDate.trim()) {
      errors.saleDate = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesViewDelivery) {
    try {
    } catch (e) {}
  }

  async function getSale() {
    setLoading(true);
    if (id && isNumeric(id)) {
      const salesRepository = new SalesRepository();
      const existingSale = await salesRepository.getSingle(parseInt(id));
      if (existingSale) {
        const { saleData, saleError } = existingSale;
        if (saleData && !saleError) {
          setSale(saleData);
        }
      }
    }
  }

  async function getProfilesShowsWarehouses() {
    setLoading(true);
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
    const warehousesRepository = new WarehousesRepository();
    const allWarehouses = await warehousesRepository.getWithoutFilters();
    if (allWarehouses) {
      const { warehousesData, warehousesError } = allWarehouses;
      if (warehousesData && !warehousesError) {
        setWarehouses(warehousesData);
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
    setLoading(false);
  }

  useEffect(() => {
    getSale();
    getProfilesShowsWarehouses();
    getData();
  }, []);

  return {
    validate,
    onSubmit,
    sale,
    loading,
    salesPersons,
    closers,
    shows,
    warehouses,
    opportunities,
    data,
    dataCount,
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
  };
}
