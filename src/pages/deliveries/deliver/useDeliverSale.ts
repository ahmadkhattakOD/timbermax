import { openSnackbar } from "api/snackbar";
import { FormikHelpers } from "formik";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { UserRoles, isNumeric } from "utils/helpers";
import InvoicesRepository, {
  InvoiceSupabase,
} from "utils/repositories/invoicesRepository";
import OpportunityDescriptionsRepository from "utils/repositories/opportunityDescriptionsRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";
import SalesRepository, {
  SaleSupabase,
} from "utils/repositories/salesRepository";
import ShowsRepository from "utils/repositories/showsRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";

export interface ValuesDeliverSale {
  contactName: string;
  deposit: string;
  total: string;
  paymentMethod: string;
  phone: string;
  mobile: string;
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
}

export function useDeliverSale() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [closers, setClosers] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [sale, setSale] = useState<any>(null);
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([
    "",
  ]);
  const { id } = useParams();

  function validate(values: ValuesDeliverSale) {
    const errors = {} as ValuesDeliverSale;

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

    if (!values.deliveryDateTime.trim()) {
      errors.deliveryDateTime = "required";
    }

    if (!values.stockFromWarehouse.trim()) {
      errors.stockFromWarehouse = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesDeliverSale) {
    try {
      if (id && isNumeric(id)) {
        const salesRepository = new SalesRepository();
        const deliveredSale = await salesRepository.deliver(
          parseInt(id),
          values.followUpNotes,
          new Date(values.deliveryDateTime),
          parseInt(values.stockFromWarehouse)
        );

        if (deliveredSale) {
          const profilesRepository = new ProfilesRepository();
          const salesPersonProfile = await profilesRepository.getSingle(
            values.salesPerson
          );
          const closerProfile = await profilesRepository.getSingle(
            values.closer
          );

          if (salesPersonProfile && closerProfile) {
            const {
              profileData: salesProfileData,
              profileError: salesProfileError,
            } = salesPersonProfile;
            const {
              profileData: closerProfileData,
              profileError: closerProfileError,
            } = closerProfile;

            if (
              salesProfileData &&
              closerProfileData &&
              !salesProfileError &&
              !closerProfileError
            ) {
              let salesPersonCommissionPercentage =
                salesProfileData.commissions &&
                salesProfileData.commissions.length > 0
                  ? salesProfileData.commissions[0] / 100
                  : 0;

              let closerCommissionPercentage = 0;

              if (closerProfileData.role === UserRoles.Both) {
                closerCommissionPercentage =
                  closerProfileData.commissions &&
                  closerProfileData.commissions.length > 1
                    ? closerProfileData.commissions[1] / 100
                    : 0;
              } else {
                closerCommissionPercentage =
                  closerProfileData.commissions &&
                  closerProfileData.commissions.length > 0
                    ? closerProfileData.commissions[0] / 100
                    : 0;
              }

              const newSalesPersonInvoice: InvoiceSupabase = {
                sale: deliveredSale.id,
                commission:
                  parseFloat(values.total) * salesPersonCommissionPercentage,
                beneficiary: values.salesPerson,
              };
              const newCloserInvoice: InvoiceSupabase = {
                sale: deliveredSale.id,
                commission:
                  parseFloat(values.total) * closerCommissionPercentage,
                beneficiary: values.closer,
              };

              const invoicesRepository = new InvoicesRepository();
              const createdSalesPersonInvoice = await invoicesRepository.create(
                newSalesPersonInvoice
              );
              const createdCloserInvoice =
                await invoicesRepository.create(newCloserInvoice);

              if (createdSalesPersonInvoice && createdCloserInvoice) {
                if (sale?.closed) {
                  openSnackbar({
                    open: true,
                    message:
                      "Sale marked as delivered successfully and invoices have been updated.",
                    variant: "alert",
                    alert: {
                      color: "success",
                    },
                  } as SnackbarProps);
                } else {
                  openSnackbar({
                    open: true,
                    message:
                      "Sale closed and marked as delivered successfully and invoices have been updated.",
                    variant: "alert",
                    alert: {
                      color: "success",
                    },
                  } as SnackbarProps);
                }
              } else {
                openSnackbar({
                  open: true,
                  message:
                    "Sale closed and marked as delivered successfully but invoices could not be updated.",
                  variant: "alert",
                  alert: {
                    color: "success",
                  },
                } as SnackbarProps);
              }
            }
          } else {
            openSnackbar({
              open: true,
              message:
                "Sale closed and marked as delivered successfully but invoices could not be updated.",
              variant: "alert",
              alert: {
                color: "success",
              },
            } as SnackbarProps);
          }
        } else {
          openSnackbar({
            open: true,
            message:
              "Sale could not be marked as delivered successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate("/deliveries");
      } else {
        openSnackbar({
          open: true,
          message:
            "Sale could not be marked as delivered successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);

        navigate("/deliveries");
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Sale could not be marked as delivered successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate("/deliveries");
    }
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
          setSelectedOpportunities(saleData.opportunity_descriptions);
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
    selectedOpportunities,
  };
}
