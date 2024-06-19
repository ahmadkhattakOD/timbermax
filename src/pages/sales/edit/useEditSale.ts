import { openSnackbar } from "api/snackbar";
import { FormikHelpers } from "formik";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { UserRoles, isNumeric } from "utils/helpers";
import OpportunityDescriptionsRepository from "utils/repositories/opportunityDescriptionsRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";
import SalesRepository, {
  SaleSupabase,
} from "utils/repositories/salesRepository";
import ShowsRepository from "utils/repositories/showsRepository";

export interface ValuesEditSale {
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

export function useEditSale() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [closers, setClosers] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [sale, setSale] = useState<any>(null);
  const { id } = useParams();

  function validate(values: ValuesEditSale) {
    const errors = {} as ValuesEditSale;

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

  async function onSubmit(values: ValuesEditSale) {
    try {
      if (id && isNumeric(id)) {
        const updatedSale: SaleSupabase = {
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
        const editedSale = await salesRepository.edit(
          parseInt(id),
          updatedSale
        );

        if (editedSale) {
          openSnackbar({
            open: true,
            message: "Sale edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message: "Sale could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate("/sales");
      } else {
        openSnackbar({
          open: true,
          message: "Sale could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);

        navigate("/sales");
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Sale could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate("/sales");
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
        }
      }
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
    getProfilesShows();
  }, []);

  return {
    validate,
    onSubmit,
    sale,
    loading,
    salesPersons,
    closers,
    shows,
    opportunities,
  };
}
