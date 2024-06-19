import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { UserRoles } from "utils/helpers";
import InvoicesRepository, {
  InvoiceSupabase,
} from "utils/repositories/invoicesRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";
import SalesRepository, {
  SaleSupabase,
} from "utils/repositories/salesRepository";
import ShowsRepository from "utils/repositories/showsRepository";

export interface ValuesCreateSale {
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
}

export function useCreateSale() {
  const navigate = useNavigate();
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [closers, setClosers] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function validate(values: ValuesCreateSale) {
    const errors = {} as ValuesCreateSale;

    return errors;
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

    if (!values.show.trim()) {
      errors.show = "required";
    }

    if (!values.saleDate.trim()) {
      errors.saleDate = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateSale) {
    try {
      const newSale: SaleSupabase = {
        contact_name: values.contactName,
        opportunity_description: values.opportunityDescription,
        deposit: parseFloat(values.deposit) ?? 0,
        total: parseFloat(values.total) ?? 0,
        payment_method: values.paymentMethod,
        phone: values.phone,
        address: values.address,
        state: values.state,
        post_code: values.postCode,
        email_address: values.emailAddress,
        note: values.note,
        sales_person: values.salesPerson,
        closer: values.closer,
        status: values.status,
        show: parseInt(values.show),
        follow_up_notes: values.followUpNotes,
        sale_date: new Date(values.saleDate),
      };

      const salesRepository = new SalesRepository();
      const createdSale = await salesRepository.create(newSale);

      if (createdSale) {
        if (parseFloat(values.deposit) / parseFloat(values.total) >= 0.2) {
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
              const newSalesPersonInvoice: InvoiceSupabase = {
                sale: createdSale.id,
                commission:
                  parseFloat(values.total) *
                  (salesProfileData.commission
                    ? salesProfileData.commission / 100
                    : 0),
                beneficiary: values.salesPerson,
              };
              const newCloserInvoice: InvoiceSupabase = {
                sale: createdSale.id,
                commission:
                  parseFloat(values.total) *
                  (closerProfileData.commission
                    ? closerProfileData.commission / 100
                    : 0),
                beneficiary: values.closer,
              };

              const invoicesRepository = new InvoicesRepository();
              const createdSalesPersonInvoice = await invoicesRepository.create(
                newSalesPersonInvoice
              );
              const createdCloserInvoice =
                await invoicesRepository.create(newCloserInvoice);

              if (createdSalesPersonInvoice && createdCloserInvoice) {
                openSnackbar({
                  open: true,
                  message: "Sale added and invoice created successfully.",
                  variant: "alert",
                  alert: {
                    color: "success",
                  },
                } as SnackbarProps);
              } else {
                const idToDelete = [createdSale.id];
                await salesRepository.delete(idToDelete);
                openSnackbar({
                  open: true,
                  message:
                    "Sale could not be added successfully. Please try again.",
                  variant: "alert",
                  alert: {
                    color: "error",
                  },
                } as SnackbarProps);
              }
            }
          } else {
            const idToDelete = [createdSale.id];
            await salesRepository.delete(idToDelete);
            openSnackbar({
              open: true,
              message:
                "Sale could not be added successfully. Please try again.",
              variant: "alert",
              alert: {
                color: "error",
              },
            } as SnackbarProps);
          }
        } else {
          openSnackbar({
            open: true,
            message: "Sale added successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        }
      } else {
        openSnackbar({
          open: true,
          message: "Sale could not be added successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      }

      navigate("/sales");
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Sale could not be added successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate("/sales");
    }
  }

  async function getProfilesShows() {
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
    setLoading(false);
  }

  useEffect(() => {
    getProfilesShows();
  }, []);

  return { validate, onSubmit, salesPersons, closers, shows, loading };
}
