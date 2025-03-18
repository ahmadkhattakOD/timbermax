import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  UserRoles,
  opportunityDescriptions,
  parseAddress,
  useDebouncedSearch,
} from "utils/helpers";
import CustomersRepository, {
  CustomerSupabase,
} from "utils/repositories/customersRepository";
import InvoicesRepository, {
  InvoiceSupabase,
} from "utils/repositories/invoicesRepository";
import OpportunityDescriptionsRepository from "utils/repositories/opportunityDescriptionsRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";
import SaleOpportunitiesRepository, {
  SaleOpportunitySupabase,
} from "utils/repositories/saleOpportunitiesRepository";
import SalesRepository, {
  SaleSupabase,
} from "utils/repositories/salesRepository";
import ShowsRepository from "utils/repositories/showsRepository";

export interface ValuesCreateSale {
  contactName: string;
  inlineCustomerName: string;
  deposit: string;
  total: string;
  paymentMethod: string;
  phone: string;
  mobile: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
  emailAddress: string;
  note: string;
  salesPerson: string;
  closer: string;
  status: string;
  milestone: string;
  expectedCloseDate: string;
  lostReason: string;
  show: string;
  followUpNotes: string;
  saleDate: string;
  cpapAmount?: string; // cpap_value in schema
  is_cpap_pickedup?: string;
}

export function useCreateSale() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [closers, setClosers] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>(
    []
  );
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [selectedMobile, setSelectedMobile] = useState<string>("");
  const [selectedPostCode, setSelectedPostCode] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(undefined);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [createInlineCustomer, setCreateInlineCustomer] = useState(false);
  const [searchOpportunity, setSearchOpportunity] = useState("");
  const [isCpapPickup, setIsCpapPickup] = useState("Yes");
  const [containCpap, setContainCpap] = useState(false);

  function handleChangeSelectedOpportunities(
    e: React.ChangeEvent<HTMLSelectElement>,
    idx: number
  ) {
    let temp = [...selectedOpportunities];
    temp[idx] = e.target.innerText; // changed from value to innerText
    setSelectedOpportunities(temp);
    // console.log(e.target.value);
  }

  function addSelectedOpportunity() {
    let temp = [...selectedOpportunities];
    temp.push("");
    setSelectedOpportunities(temp);
  }

  function removeSelectedOpportunity(idx: number) {
    let temp = [...selectedOpportunities];
    temp.splice(idx, 1);
    setSelectedOpportunities(temp);
  }

  function changeAddress(newValue: any, actionMeta: any) {
    let addressComponents = parseAddress(newValue?.value?.description ?? "");
    setSelectedSuburb(addressComponents.suburb);
    setSelectedState(addressComponents.state);
    setSelectedAddress(newValue?.value?.description ?? "");
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomerSearch(e.target.value);
  }

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

  function resetCustomerData() {
    setSelectedEmail("");
    setSelectedPhone("");
    setSelectedMobile("");
    setSelectedAddress("");
    setSelectedSuburb("");
    setSelectedState("");
    setSelectedPostCode("");
  }

  function validate(values: ValuesCreateSale) {
    const errors = {} as ValuesCreateSale;

    if (!createInlineCustomer && !selectedCustomer) {
      errors.contactName = "required";
    }

    if (createInlineCustomer && !values.inlineCustomerName.trim()) {
      errors.inlineCustomerName = "required";
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

    if (
      values.total &&
      values.deposit &&
      parseFloat(values.deposit) > parseFloat(values.total)
    ) {
      errors.deposit = "deposit-greater-than-total";
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

  async function onSubmit(values: ValuesCreateSale) {
    try {
      let customerToAdd = selectedCustomer;

      if (createInlineCustomer) {
        const newCustomer: CustomerSupabase = {
          name: values.inlineCustomerName,
          phone: selectedPhone,
          mobile: selectedMobile,
          address: selectedAddress,
          suburb: selectedSuburb,
          state: selectedState,
          post_code: selectedPostCode,
          email: selectedEmail,
        };
        const customersRepository = new CustomersRepository();
        const createdCustomer = await customersRepository.create(newCustomer);
        if (createdCustomer) {
          customerToAdd = createdCustomer.id;
        } else if (createdCustomer === false) {
          openSnackbar({
            open: true,
            message:
              "Another customer already exists with the same name and address. Please select the customer to continue.",
            variant: "alert",
            alert: { color: "error" },
          } as SnackbarProps);
          return;
        } else {
          openSnackbar({
            open: true,
            message:
              "Customer could not be added successfully. Please try again.",
            variant: "alert",
            alert: { color: "error" },
          } as SnackbarProps);
          return;
        }
      }

      const newSale: SaleSupabase = {
        contact_name: "REPORT IF YOU SEE THIS",
        customer: customerToAdd,
        opportunity_descriptions:
          selectedOpportunities.length > 0 ? selectedOpportunities : [],
        deposit: parseFloat(values.deposit) || 0,
        total: parseFloat(values.total) ?? 0,
        payment_method: values.paymentMethod,
        phone: selectedPhone,
        mobile: selectedMobile,
        address: selectedAddress,
        suburb: selectedSuburb,
        state: selectedState,
        post_code: selectedPostCode,
        email_address: selectedEmail,
        note: values.note,
        sales_person: values.salesPerson,
        closer: values.closer,
        status: values.status,
        milestone: values.milestone,
        expected_close_date: values.expectedCloseDate
          ? new Date(values.expectedCloseDate)
          : null,
        lost_reason: values.milestone !== "lost" ? "" : values.lostReason,
        show: parseInt(values.show),
        follow_up_notes: values.followUpNotes,
        sale_date: new Date(values.saleDate),
        cpap_value: values.cpapAmount || "0",
        is_cpap_pickedup: isCpapPickup || "NO",
      };

      const salesRepository = new SalesRepository();
      const createdSale = await salesRepository.create(newSale);

      //helper function to normalize string since some of the values were not matching with old code that's commented out below
      const normalizeString = (str: string) =>
        str.normalize("NFKC").replace(/\s+/g, " ").trim();

      if (createdSale) {
        if (values.status !== "cancelled") {
          const saleOpportunitiesRepository = new SaleOpportunitiesRepository();
          for (let i = 0; i < selectedOpportunities.length; i++) {
            const opportunityNormalized = normalizeString(
              selectedOpportunities[i]
            );

            // const opportunityId = opportunities.find(
            //   (opp) => opp.name.trim() === selectedOpportunities[i].trim()
            // )?.id;

            const opportunityId = opportunities.find((opp) => {
              const nametrimmed = normalizeString(opp.name);
              return nametrimmed === opportunityNormalized;
            })?.id;

            if (opportunityId) {
              const newSaleOpportunity: SaleOpportunitySupabase = {
                sale: createdSale.id,
                opportunity: opportunityId,
              };

              const createdSaleOpportunity =
                await saleOpportunitiesRepository.create(newSaleOpportunity);
              if (!createdSaleOpportunity) {
                await salesRepository.delete([createdSale.id]);
                openSnackbar({
                  open: true,
                  message:
                    "Sale could not be added successfully. Please try again.",
                  variant: "alert",
                  alert: { color: "error" },
                } as SnackbarProps);

                navigate("/sales");
                return;
              }
            } else {
              await salesRepository.delete([createdSale.id]);
              openSnackbar({
                open: true,
                message:
                  "Sale could not be added successfully. Please try again.",
                variant: "alert",
                alert: { color: "error" },
              } as SnackbarProps);

              navigate("/sales");
              return;
            }
          }

          // Calculate commission base amount (excluding CPAP)
          const cpapAmount = parseFloat(values.cpapAmount || "0") || 0;
          const nonCpapTotal = parseFloat(values.total) - cpapAmount;
          const remainingDeposit = parseFloat(values.deposit) - cpapAmount;

          if (remainingDeposit / nonCpapTotal >= 0.2) {
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

                // Use remainingDeposit for commission calculations
                const commissionBase = nonCpapTotal - 300;

                const newSalesPersonInvoice: InvoiceSupabase = {
                  sale: createdSale.id,
                  commission: commissionBase * salesPersonCommissionPercentage,
                  beneficiary: values.salesPerson,
                };

                const newCloserInvoice: InvoiceSupabase = {
                  sale: createdSale.id,
                  commission: commissionBase * closerCommissionPercentage,
                  beneficiary: values.closer,
                };

                // console.log({
                //   commissionBase,
                //   supabase: commissionBase * closerCommissionPercentage,
                //   closerCommissionPercentage,
                // });

                const invoicesRepository = new InvoicesRepository();
                const [salesInvoice, closerInvoice] = await Promise.all([
                  invoicesRepository.create(newSalesPersonInvoice),
                  invoicesRepository.create(newCloserInvoice),
                ]);

                if (salesInvoice && closerInvoice) {
                  openSnackbar({
                    open: true,
                    message: "Sale added and invoice created successfully.",
                    variant: "alert",
                    alert: { color: "success" },
                  } as SnackbarProps);
                } else {
                  await salesRepository.delete([createdSale.id]);
                  openSnackbar({
                    open: true,
                    message: "Failed to create commission invoices.",
                    variant: "alert",
                    alert: { color: "error" },
                  } as SnackbarProps);
                }
              }
            } else {
              await salesRepository.delete([createdSale.id]);
              openSnackbar({
                open: true,
                message: "Salesperson/closer profiles not found.",
                variant: "alert",
                alert: { color: "error" },
              } as SnackbarProps);
            }
          } else {
            openSnackbar({
              open: true,
              message: "Sale added successfully.",
              variant: "alert",
              alert: { color: "success" },
            } as SnackbarProps);
          }
        } else {
          openSnackbar({
            open: true,
            message: "Sale added successfully.",
            variant: "alert",
            alert: { color: "success" },
          } as SnackbarProps);
        }
      } else {
        openSnackbar({
          open: true,
          message: "Sale could not be added successfully. Please try again.",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
      }

      navigate("/sales");
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Sale could not be added successfully. Please try again.",
        variant: "alert",
        alert: { color: "error" },
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

  async function getCustomers() {
    setLoadingCustomers(true);
    const customersRepository = new CustomersRepository();
    const allCustomers = await customersRepository.getByName(customerSearch);
    if (allCustomers) {
      const { customersData, customersError } = allCustomers;
      if (customersData && !customersError) {
        setCustomers(customersData);
      }
    }
    setLoadingCustomers(false);
  }

  useEffect(() => {
    getProfilesShows();
  }, []);

  useEffect(() => {
    if (!createInlineCustomer) {
      getCustomers();
    }
  }, [customerSearch, createInlineCustomer]);

  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find((c) => c.id === selectedCustomer);
      if (customer) {
        setSelectedEmail(customer.email);
        setSelectedPhone(customer.phone);
        setSelectedMobile(customer.mobile);
        setSelectedAddress(customer.address);
        setSelectedSuburb(customer.suburb);
        setSelectedState(customer.state);
        setSelectedPostCode(customer.post_code);
      }
    } else {
      resetCustomerData();
    }
  }, [selectedCustomer]);

  return {
    validate,
    onSubmit,
    customers,
    salesPersons,
    closers,
    shows,
    opportunities,
    loading,
    selectedOpportunities,
    handleChangeSelectedOpportunities,
    addSelectedOpportunity,
    removeSelectedOpportunity,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
    selectedEmail,
    setSelectedEmail,
    selectedPhone,
    setSelectedPhone,
    selectedMobile,
    setSelectedMobile,
    selectedPostCode,
    setSelectedPostCode,
    selectedCustomer,
    setSelectedCustomer,
    customerSearch,
    handleSearchDebounced,
    loadingCustomers,
    createInlineCustomer,
    setCreateInlineCustomer,
    searchOpportunity,
    setSearchOpportunity,
    containCpap,
    setContainCpap,
    isCpapPickup,
    setIsCpapPickup,
  };
}
