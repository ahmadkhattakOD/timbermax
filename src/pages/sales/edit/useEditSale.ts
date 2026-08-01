import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  UserRoles,
  isNumeric,
  normalizeString,
  parseAddress,
  roundAmount,
  useDebouncedSearch,
} from "utils/helpers";
import CustomersRepository from "utils/repositories/customersRepository";
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

export interface ValuesEditSale {
  contactName: string;
  opportunityDescription: string;
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
}

export function useEditSale() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [closers, setClosers] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [sale, setSale] = useState<any>(null);
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([
    "",
  ]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [selectedMobile, setSelectedMobile] = useState<string>("");
  const [selectedPostCode, setSelectedPostCode] = useState<string>("");
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(undefined);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const { id } = useParams();

  function handleChangeSelectedOpportunities(
    e: React.ChangeEvent<HTMLSelectElement>,
    idx: number
  ) {
    let temp = [...selectedOpportunities];
    temp[idx] = e.target.value;
    setSelectedOpportunities(temp);
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

  function validate(values: ValuesEditSale) {
    const errors = {} as ValuesEditSale;

    if (!selectedCustomer) {
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
  console.log(sale);

  async function onSubmit(values: ValuesEditSale) {
    try {
      if (id && isNumeric(id)) {
        const updatedSale: SaleSupabase = {
          contact_name: "REPORT IF YOU SEE THIS",
          customer: selectedCustomer,
          opportunity_descriptions: selectedOpportunities,
          deposit: roundAmount(values.deposit),
          total: roundAmount(values.total),
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
        };

        const salesRepository = new SalesRepository();
        const editedSale = await salesRepository.edit(
          parseInt(id),
          updatedSale
        );

        if (editedSale) {
          const saleOpportunitiesRepository = new SaleOpportunitiesRepository();
          await saleOpportunitiesRepository.deleteBySale(editedSale.id);


          if (values.status !== "cancelled") {
            for (let i = 0; i < selectedOpportunities.length; i++) {
              const opportunityNormalized = normalizeString(
                selectedOpportunities[i]
              );
              const opportunityId = opportunities.find((opp) => {
                const nametrimmed = normalizeString(opp.name);
                return nametrimmed === opportunityNormalized;
              })?.id;

              if (opportunityId) {
                const newSaleOpportunity: SaleOpportunitySupabase = {
                  sale: editedSale.id,
                  opportunity: opportunityId,
                };
                const createdSaleOpportunity =
                  await saleOpportunitiesRepository.create(newSaleOpportunity);

                if (!createdSaleOpportunity) {
                  openSnackbar({
                    open: true,
                    message:
                      "Sale could not be edited successfully. Please try again.",
                    variant: "alert",
                    alert: {
                      color: "error",
                    },
                  } as SnackbarProps);

                  navigate("/sales");
                  return;
                }
              } else {
                openSnackbar({
                  open: true,
                  message:
                    "Sale could not be edited successfully. Please try again.",
                  variant: "alert",
                  alert: {
                    color: "error",
                  },
                } as SnackbarProps);

                navigate("/sales");
                return;
              }
            }

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

                  const newSalesPersonInvoice: any = {
                    sale: editedSale.id,
                    commission: roundAmount(
                      (parseFloat(values.total) - 300) *
                        salesPersonCommissionPercentage
                    ),
                    beneficiary: values.salesPerson,
                  };
                  const newCloserInvoice: any = {
                    sale: editedSale.id,
                    commission: roundAmount(
                      (parseFloat(values.total) - 300) *
                        closerCommissionPercentage
                    ),
                    beneficiary: values.closer,
                  };

                  const invoicesRepository = new InvoicesRepository();

                  // await invoicesRepository.findAndDelete(
                  //   parseInt(id),
                  //   values.salesPerson
                  // );
                  // await invoicesRepository.findAndDelete(
                  //   parseInt(id),
                  //   values.closer
                  // );
                  const createdSalesPersonInvoice =
                    await invoicesRepository.create(newSalesPersonInvoice);
                  const createdCloserInvoice =
                    await invoicesRepository.create(newCloserInvoice);

                  if (createdSalesPersonInvoice && createdCloserInvoice) {
                    openSnackbar({
                      open: true,
                      message: "Sale edited and invoice created successfully.",
                      variant: "alert",
                      alert: {
                        color: "success",
                      },
                    } as SnackbarProps);
                  } else {
                    const idToDelete = [editedSale.id];
                    await salesRepository.delete(idToDelete);
                    openSnackbar({
                      open: true,
                      message:
                        "Sale could not be edited successfully. Please try again.",
                      variant: "alert",
                      alert: {
                        color: "error",
                      },
                    } as SnackbarProps);
                  }
                }
              } else {
                openSnackbar({
                  open: true,
                  message:
                    "Sale could not be edited successfully. Please try again.",
                  variant: "alert",
                  alert: {
                    color: "error",
                  },
                } as SnackbarProps);
              }
            } else {
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

                  const newSalesPersonInvoice: any = {
                    sale: editedSale.id,
                    commission: roundAmount(
                      (parseFloat(values.total) - 300) *
                        salesPersonCommissionPercentage
                    ),
                    beneficiary: values.salesPerson,
                  };
                  const newCloserInvoice: any = {
                    sale: editedSale.id,
                    commission: roundAmount(
                      (parseFloat(values.total) - 300) *
                        closerCommissionPercentage
                    ),
                    beneficiary: values.closer,
                  };

                  const invoicesRepository = new InvoicesRepository();

                  // const deletedSalesPersonInvoice =
                  //   await invoicesRepository.findAndDelete(
                  //     parseInt(id),
                  //     values.salesPerson
                  //   );
                  // const deletedCloserInvoice =
                  //   await invoicesRepository.findAndDelete(
                  //     parseInt(id),
                  //     values.closer
                  //   );
                  const deletedSalesPersonInvoice = null
                  const deletedCloserInvoice = null

                  if (deletedSalesPersonInvoice && deletedCloserInvoice) {
                    openSnackbar({
                      open: true,
                      message: "Sale edited and invoice managed successfully.",
                      variant: "alert",
                      alert: {
                        color: "success",
                      },
                    } as SnackbarProps);
                  } else {
                    const idToDelete = [editedSale.id];
                    await salesRepository.delete(idToDelete);
                    openSnackbar({
                      open: true,
                      message:
                        "Sale could not be edited successfully. Please try again.",
                      variant: "alert",
                      alert: {
                        color: "error",
                      },
                    } as SnackbarProps);
                  }
                }
              } else {
                openSnackbar({
                  open: true,
                  message:
                    "Sale could not be edited successfully. Please try again.",
                  variant: "alert",
                  alert: {
                    color: "error",
                  },
                } as SnackbarProps);
              }
            }
          } else {
            openSnackbar({
              open: true,
              message: "Sale edited successfully.",
              variant: "alert",
              alert: {
                color: "success",
              },
            } as SnackbarProps);
          }
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
          if (saleData.opportunity_descriptions.length > 0) {
            setSelectedOpportunities(saleData.opportunity_descriptions);
          }
          setSelectedAddress(saleData.address);
          setSelectedSuburb(saleData.suburb);
          setSelectedState(saleData.state);
          setSelectedEmail(saleData.email_address);
          setSelectedPhone(saleData.phone);
          setSelectedMobile(saleData.mobile);
          setSelectedPostCode(saleData.post_code);
          setInvoiceCreated(
            saleData.invoiced_sales_person || saleData.invoiced_closer
          );
          const customer = saleData.customer as any;
          setSelectedCustomer(customer.id);
        }
      }
    }
  }

  // async function getInvoice() {
  //   setLoading(true);
  //   if (id && isNumeric(id)) {
  //     const invoicesRepository = new InvoicesRepository();
  //     const existingInvoice = await invoicesRepository.checkExistenceBySale(
  //       parseInt(id)
  //     );
  //     if (existingInvoice) {
  //       const { invoiceData, invoiceError } = existingInvoice;
  //       if (invoiceData && !invoiceError) {
  //         setInvoiceCreated(true);
  //       }
  //     }
  //   }
  // }

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
    getSale();
    // getInvoice();
    getProfilesShows();
  }, []);

  useEffect(() => {
    getCustomers();
  }, [customerSearch]);

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
    sale,
    loading,
    customers,
    salesPersons,
    closers,
    shows,
    opportunities,
    selectedOpportunities,
    handleChangeSelectedOpportunities,
    addSelectedOpportunity,
    removeSelectedOpportunity,
    invoiceCreated,
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
  };
}
