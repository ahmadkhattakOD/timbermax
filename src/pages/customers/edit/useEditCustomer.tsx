import { Checkbox, TableCell, Typography } from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate, useParams } from "react-router";
import { useSearchParams } from "react-router-dom";
import { SnackbarProps } from "types/snackbar";
import {
  UserRoles,
  getDateFormatted,
  getDateTimeFormatted,
  initialRowsPerPage,
  isNumeric,
  parseAddress,
  useDebouncedSearch,
} from "utils/helpers";
import CommunicationRepository from "utils/repositories/communicationRepository";
import CustomersRepository, {
  CustomerSupabase,
} from "utils/repositories/customersRepository";
import OpportunityDescriptionsRepository from "utils/repositories/opportunityDescriptionsRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";
import SalesRepository from "utils/repositories/salesRepository";
import ShowsRepository from "utils/repositories/showsRepository";

const headCellsSales: HeadCell[] = [
  {
    id: "name",
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
    id: "status_changed_at",
    numeric: false,
    disablePadding: true,
    label: "Status Changed At",
  },
  {
    id: "milestone",
    numeric: false,
    disablePadding: true,
    label: "Milestone",
  },
  {
    id: "expected_close_date",
    numeric: false,
    disablePadding: true,
    label: "Expected Close Date",
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

const headCellsCommunication: HeadCell[] = [
  {
    id: "method",
    numeric: false,
    disablePadding: true,
    label: "Method",
  },
  {
    id: "notes",
    numeric: false,
    disablePadding: true,
    label: "Notes",
  },
  {
    id: "date",
    numeric: false,
    disablePadding: true,
    label: "Date",
  },
  {
    id: "created_at",
    numeric: false,
    disablePadding: true,
    label: "Recorded At",
  },
];

export interface ValuesFilterSales {
  contactName: string;
  salesPerson: string;
  minimumDeposit: string;
  maximumDeposit: string;
  minimumTotal: string;
  maximumTotal: string;
  paymentMethod: string;
  phone: string;
  mobile: string;
  address: string;
  state: string;
  postCode: string;
  emailAddress: string;
  opportunityDescription: string;
  closer: string;
  status: string;
  show: string;
  saleDateFrom: string;
  saleDateTo: string;
  closed: string;
}

const initialFiltersSales: ValuesFilterSales = {
  contactName: "",
  salesPerson: "",
  minimumDeposit: "",
  maximumDeposit: "",
  minimumTotal: "",
  maximumTotal: "",
  paymentMethod: "",
  phone: "",
  mobile: "",
  address: "",
  state: "",
  postCode: "",
  emailAddress: "",
  opportunityDescription: "",
  closer: "",
  status: "",
  show: "",
  saleDateFrom: "",
  saleDateTo: "",
  closed: "",
};

export interface ValuesFilterCommunication {
  method: string;
  dateFrom: string;
  dateTo: string;
}

const initialFiltersCommunication: ValuesFilterCommunication = {
  method: "",
  dateFrom: "",
  dateTo: "",
};

export interface ValuesEditCustomer {
  name: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
  lostReason: string;
  notes: string;
}

export function useEditCustomer() {
  const navigate = useNavigate();
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("");

  const [dataSales, setDataSales] = useState<any[]>([]);
  const [dataCountSales, setDataCountSales] = useState<number>(0);
  const [orderSales, setOrderSales] = useState<Order>("desc");
  const [orderBySales, setOrderBySales] = useState<string>("created_at");
  const [selectedSales, setSelectedSales] = useState<readonly number[]>([]);
  const [pageSales, setPageSales] = useState(0);
  const [rowsPerPageSales, setRowsPerPageSales] = useState(initialRowsPerPage);
  const [loadingSales, setLoadingSales] = useState<boolean>(false);
  const [deleteConfirmModalOpenSales, setDeleteConfirmModalOpenSales] =
    useState(false);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [closers, setClosers] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [filterModalOpenSales, setFilterModalOpenSales] = useState(false);
  const [filtersSales, setFiltersSales] =
    useState<ValuesFilterSales>(initialFiltersSales);
  const [csvDataSales, setCsvDataSales] = useState<string>("");
  const csvLinkSales = useRef<any>();

  const [dataCommunication, setDataCommunication] = useState<any[]>([]);
  const [dataCountCommunication, setDataCountCommunication] =
    useState<number>(0);
  const [orderCommunication, setOrderCommunication] = useState<Order>("desc");
  const [orderByCommunication, setOrderByCommunication] =
    useState<string>("created_at");
  const [selectedCommunication, setSelectedCommunication] = useState<
    readonly number[]
  >([]);
  const [pageCommunication, setPageCommunication] = useState(0);
  const [rowsPerPageCommunication, setRowsPerPageCommunication] =
    useState(initialRowsPerPage);
  const [loadingCommunication, setLoadingCommunication] =
    useState<boolean>(false);
  const [
    deleteConfirmModalOpenCommunication,
    setDeleteConfirmModalOpenCommunication,
  ] = useState(false);
  const [filterModalOpenCommunication, setFilterModalOpenCommunication] =
    useState(false);
  const [filtersCommunication, setFiltersCommunication] =
    useState<ValuesFilterCommunication>(initialFiltersCommunication);
  const [csvDataCommunication, setCsvDataCommunication] = useState<string>("");
  const csvLinkCommunication = useRef<any>();

  const { id } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      (tab === "Information" || tab === "Sales" || tab === "Communication")
    ) {
      setSelectedTab(tab);
    } else {
      setSelectedTab("Information");
    }
  }, [searchParams]);

  /* INFO START */

  function changeAddress(newValue: any, actionMeta: any) {
    let addressComponents = parseAddress(newValue?.value?.description ?? "");
    setSelectedSuburb(addressComponents.suburb);
    setSelectedState(addressComponents.state);
    setSelectedAddress(newValue?.value?.description ?? "");
  }

  function validate(values: ValuesEditCustomer) {
    const errors = {} as ValuesEditCustomer;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditCustomer) {
    try {
      if (id && isNumeric(id)) {
        const updatedCustomer: CustomerSupabase = {
          name: values.name,
          email: values.email,
          phone: values.phone,
          mobile: values.mobile,
          address: selectedAddress,
          suburb: selectedSuburb,
          state: selectedState,
          post_code: values.postCode,
          notes: values.notes,
          lost_reason: values.lostReason,
        };

        const customersRepository = new CustomersRepository();
        const editedCustomer = await customersRepository.edit(
          parseInt(id),
          updatedCustomer
        );

        if (editedCustomer) {
          openSnackbar({
            open: true,
            message: "Customer edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Customer could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate("/customers");
      } else {
        openSnackbar({
          open: true,
          message:
            "Customer could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);

        navigate("/customers");
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Customer could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate("/customers");
    }
  }

  async function getCustomer() {
    setLoadingInfo(true);
    if (id && isNumeric(id)) {
      const customersRepository = new CustomersRepository();
      const existingCustomer = await customersRepository.getSingle(
        parseInt(id)
      );
      if (existingCustomer) {
        const { customerData, customerError } = existingCustomer;
        if (customerData && !customerError) {
          setCustomer(customerData);
          setSelectedAddress(customerData.address);
          setSelectedSuburb(customerData.suburb);
          setSelectedState(customerData.state);
        }
      }
    }
    setLoadingInfo(false);
  }

  useEffect(() => {
    getCustomer();
  }, []);

  /* INFO ENDS */

  // SALES START

  function goToCreateSales() {
    navigate("/sales/new");
  }

  function generateTableCellsSales(
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
          {row.customer?.name}
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
        <TableCell sx={{ minWidth: 200 }}>{row.suburb}</TableCell>
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
        <TableCell sx={{ minWidth: 200 }}>
          {row.status_changed_at && getDateFormatted(row.status_changed_at)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.milestone && <FormattedMessage id={row.milestone} />}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.expected_close_date && getDateFormatted(row.expected_close_date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.follow_up_notes}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {getDateFormatted(row.sale_date)}
        </TableCell>
      </React.Fragment>
    );
  }

  function openDeleteConfirmModalSales() {
    setDeleteConfirmModalOpenSales(true);
  }

  async function onDeleteSales() {
    const salesRepository = new SalesRepository();
    const deletedSales = await salesRepository.delete(selectedSales);
    if (deletedSales > 0) {
      openSnackbar({
        open: true,
        message: `${deletedSales} sale(s) deleted successfully.`,
        variant: "alert",
        alert: {
          color: "success",
        },
      } as SnackbarProps);
      setSelectedSales([]);
      await getDataSales();
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

  function closeDeleteConfirmModalSales() {
    setDeleteConfirmModalOpenSales(false);
  }

  function openFilterModalSales() {
    setFilterModalOpenSales(true);
  }

  function closeFilterModalSales() {
    setFilterModalOpenSales(false);
  }

  async function getDataSales() {
    try {
      if (id && isNumeric(id)) {
        setLoadingSales(true);
        const salesRepository = new SalesRepository();
        const rangeStart = rowsPerPageSales * pageSales;
        const rangeEnd = rangeStart + rowsPerPageSales;
        const sales = await salesRepository.getByCustomer(
          parseInt(id),
          orderBySales,
          orderSales === "asc",
          rangeStart,
          rangeEnd,
          rowsPerPageSales,
          filtersSales
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
      console.error("Error fetching sales:", e);
      setLoadingSales(false);
    }
  }

  useEffect(() => {
    getDataSales();
  }, [orderSales, orderBySales, pageSales, rowsPerPageSales, filtersSales]);

  function getDataCsvSales() {
    try {
      let csvString = "";

      if (dataSales.length > 0) {
        for (let i = 0; i < dataSales.length; i++) {
          let sale = dataSales[i] as any;
          let opportunityDescriptions = "";
          if (sale?.opportunity_descriptions) {
            sale?.opportunity_descriptions.forEach((opportunity: string) => {
              opportunityDescriptions += opportunity + " ";
            });
          }
          csvString += `${sale?.customer?.name ?? ""},${opportunityDescriptions},${sale?.deposit ?? ""},${sale?.total ?? ""},${sale?.payment_method ?? ""},${sale?.phone ?? ""},${sale?.mobile ?? ""},${sale?.address ?? ""},${sale?.state ?? ""},${sale?.post_code ?? ""},${sale?.email_address ?? ""},${sale?.sales_person?.full_name ?? ""},${sale?.closer?.full_name ?? ""},${sale?.show?.name ?? ""},${sale?.note ?? ""},${sale?.status ?? ""},${sale?.status_changed_at ?? ""},${sale?.milestone},${sale?.expected_close_date},${sale?.follow_up_notes ?? ""},${sale?.sale_date ?? ""}\n`;
        }

        setCsvDataSales(csvString);

        setTimeout(() => {
          csvLinkSales?.current?.link?.click();
        }, 2000);
      }
    } catch (e) {
      console.error("Error fetching sales:", e);
      setLoadingSales(false);
    }
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
      console.error("Error filtering sales:", error);
    }
  }

  function resetFiltersSales() {
    setFiltersSales(initialFiltersSales);
  }

  async function getFilterDataSales() {
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
    getFilterDataSales();
  }, []);

  // SALES END

  // HISTORY START

  function goToCreateCommunication() {
    navigate("communication/new");
  }

  function generateTableCellsCommunication(
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
          <FormattedMessage id={row.method} />
        </TableCell>
        <TableCell sx={{ minWidth: 250 }}>{row.notes}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.date && getDateFormatted(row.date)}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {getDateTimeFormatted(row.created_at, true)}
        </TableCell>
      </React.Fragment>
    );
  }

  function openDeleteConfirmModalCommunication() {
    setDeleteConfirmModalOpenCommunication(true);
  }

  async function onDeleteCommunication() {
    const salesRepository = new SalesRepository();
    const deletedSales = await salesRepository.delete(selectedSales);
    if (deletedSales > 0) {
      openSnackbar({
        open: true,
        message: `${deletedSales} sale(s) deleted successfully.`,
        variant: "alert",
        alert: {
          color: "success",
        },
      } as SnackbarProps);
      setSelectedSales([]);
      await getDataSales();
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

  function closeDeleteConfirmModalCommunication() {
    setDeleteConfirmModalOpenCommunication(false);
  }

  function openFilterModalCommunication() {
    setFilterModalOpenCommunication(true);
  }

  function closeFilterModalCommunication() {
    setFilterModalOpenCommunication(false);
  }

  async function getDataCommunication() {
    try {
      if (id && isNumeric(id)) {
        setLoadingCommunication(true);
        const communicationRepository = new CommunicationRepository();
        const rangeStart = rowsPerPageSales * pageSales;
        const rangeEnd = rangeStart + rowsPerPageSales;
        const communication = await communicationRepository.get(
          parseInt(id),
          orderBySales,
          orderSales === "asc",
          rangeStart,
          rangeEnd,
          rowsPerPageSales,
          filtersCommunication
        );
        if (communication) {
          const { communicationData, communicationCount, communicationError } =
            communication;
          if (communicationData && !communicationError) {
            setDataCommunication(communicationData);
            setDataCountCommunication(communicationCount ?? 0);
          }
        }
        setLoadingCommunication(false);
      }
    } catch (e) {
      console.error("Error fetching communication:", e);
      setLoadingCommunication(false);
    }
  }

  useEffect(() => {
    getDataCommunication();
  }, [
    orderCommunication,
    orderByCommunication,
    pageCommunication,
    rowsPerPageCommunication,
    filtersCommunication,
  ]);

  function getDataCsvCommunication() {
    try {
      let csvString = "";

      if (dataCommunication.length > 0) {
        for (let i = 0; i < dataCommunication.length; i++) {
          let communication = dataCommunication[i] as any;

          csvString += `${communication?.method ?? ""},${communication?.notes ?? ""},${communication?.date ?? ""},${communication?.created_at ?? ""}\n`;
        }

        setCsvDataCommunication(csvString);

        setTimeout(() => {
          csvLinkCommunication?.current?.link?.click();
        }, 2000);
      }
    } catch (e) {
      console.error("Error fetching communication:", e);
      setLoadingCommunication(false);
    }
  }

  async function validateFiltersCommunication(
    values: ValuesFilterCommunication
  ) {
    const errors = {} as ValuesFilterCommunication;

    return errors;
  }

  async function handleFiltersSubmitCommunication(
    values: ValuesFilterCommunication
  ) {
    try {
      setFiltersCommunication(values);
      setFilterModalOpenCommunication(false);
    } catch (error) {
      console.error("Error filtering communications:", error);
    }
  }

  function resetFiltersCommunication() {
    setFiltersCommunication(initialFiltersCommunication);
  }

  // HISTORY END

  return {
    validate,
    onSubmit,
    customer,
    loadingInfo,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
    selectedTab,
    setSelectedTab,
    // SALES
    dataSales,
    dataCountSales,
    loadingSales,
    goToCreateSales,
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
    onDeleteSales,
    deleteConfirmModalOpenSales,
    openDeleteConfirmModalSales,
    closeDeleteConfirmModalSales,
    filterModalOpenSales,
    openFilterModalSales,
    closeFilterModalSales,
    handleFiltersSubmitSales,
    validateFiltersSales,
    filtersSales,
    salesPersons,
    closers,
    shows,
    opportunities,
    resetFiltersSales,
    getDataCsvSales,
    csvDataSales,
    csvLinkSales,
    // COMMUNICATION
    dataCommunication,
    dataCountCommunication,
    loadingCommunication,
    goToCreateCommunication,
    orderCommunication,
    setOrderCommunication,
    orderByCommunication,
    setOrderByCommunication,
    selectedCommunication,
    setSelectedCommunication,
    pageCommunication,
    setPageCommunication,
    rowsPerPageCommunication,
    setRowsPerPageCommunication,
    headCellsCommunication,
    generateTableCellsCommunication,
    onDeleteCommunication,
    deleteConfirmModalOpenCommunication,
    openDeleteConfirmModalCommunication,
    closeDeleteConfirmModalCommunication,
    filterModalOpenCommunication,
    openFilterModalCommunication,
    closeFilterModalCommunication,
    handleFiltersSubmitCommunication,
    validateFiltersCommunication,
    filtersCommunication,
    resetFiltersCommunication,
    getDataCsvCommunication,
    csvDataCommunication,
    csvLinkCommunication,
    setSearchParams,
  };
}
