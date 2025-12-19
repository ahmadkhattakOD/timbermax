import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { parseAddress, useDebouncedSearch } from "utils/helpers";
import { openSnackbar } from "api/snackbar"; // Import the snackbar function
import CustomersRepository, {
  CustomerSupabase,
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import InvoicesRepository, {
  InvoiceSupabase,
} from "utils/repositories/invoicesRepository";
import QuotationsRepository from "utils/repositories/quotationRepo";
import StocksRepository from "utils/repositories/stocksRepository";

export interface ValuesCreateInvoice {
  invoice_number: string;
  contactName: string;
  inlineCustomerName: string;
  phone: string;
  mobile: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
  emailAddress: string;
  invoice_date: string;
  note: string;
  quotation_id: string;
}

export function useCreateInvoice() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [selectedMobile, setSelectedMobile] = useState<string>("");
  const [selectedPostCode, setSelectedPostCode] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(undefined);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [createInlineCustomer, setCreateInlineCustomer] = useState(false);
  const [isQuotationLoaded, setIsQuotationLoaded] = useState(false);

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

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

  const addItem = (item: any) => {
    setSelectedItems([...selectedItems, item]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...selectedItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      updatedItems[index].total =
        updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    setSelectedItems(updatedItems);
  };

  async function loadFromQuotation(quotationId: number) {
    try {
      setLoading(true);
      const quotationsRepo = new QuotationsRepository();
      const quotation = await quotationsRepo.getSingle(quotationId);

      if (quotation?.quotationData) {
        setSelectedQuotation(quotation.quotationData);
        setIsQuotationLoaded(true);
        console.log("hellooo", quotation);
        // Load customer details
        if (quotation.quotationData.customers) {
          console.log("Not coming", quotation.quotationData.customers);
          setSelectedCustomer(quotation.quotationData.customers.id);
          setSelectedEmail(quotation.quotationData.customers.email || "");
          setSelectedPhone(quotation.quotationData.customers.phone || "");
          setSelectedMobile(quotation.quotationData.customers.mobile || "");
          setSelectedAddress(quotation.quotationData.customers.address || "");
          setSelectedSuburb(quotation.quotationData.customers.suburb || "");
          setSelectedState(quotation.quotationData.customers.state || "");
          setSelectedPostCode(
            quotation.quotationData.customers.post_code || ""
          );
        }

        // Load items
        const itemsData = await quotationsRepo.getItems(quotationId);
        if (itemsData?.data) {
          setSelectedItems(
            itemsData.data.map((item: any) => ({
              item_id: item.item_id,
              name: item.items?.name,
              itemCode: item.items?.itemCode,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total_price,
            }))
          );

          // Show success snackbar
          openSnackbar({
            action: false,
            open: true,
            message: `Loaded ${itemsData.data.length} items from quotation`,
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            variant: "alert",
            alert: {
              color: "success",
              variant: "filled",
            },
            transition: "Fade",
            close: true,
            actionButton: false,
            maxStack: 3,
            dense: false,
            iconVariant: "usedefault",
          });
        }
      } else {
        openSnackbar({
          action: false,
          open: true,
          message: "Quotation not found or could not be loaded",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
          maxStack: 3,
          dense: false,
          iconVariant: "usedefault",
        });
      }
    } catch (error) {
      console.error("Error loading quotation:", error);
      openSnackbar({
        action: false,
        open: true,
        message: "Failed to load quotation data",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "error",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
        maxStack: 3,
        dense: false,
        iconVariant: "usedefault",
      });
    } finally {
      setLoading(false);
    }
  }

  function validate(values: ValuesCreateInvoice) {
    const errors = {} as ValuesCreateInvoice;

    if (!values.invoice_number) {
      errors.invoice_number = "required";
    }

    if (!createInlineCustomer && !selectedCustomer) {
      errors.contactName = "required";
    }

    if (createInlineCustomer && !values.inlineCustomerName.trim()) {
      errors.inlineCustomerName = "required";
    }

    if (!values.invoice_date) {
      errors.invoice_date = "required";
    }

    if (selectedItems.length === 0) {
      // Add error handling for items
      // errors.items = "Add at least one item";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateInvoice) {
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
            action: false,
            open: true,
            message:
              "Another customer already exists with the same name and address. Please select the customer to continue.",
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            variant: "alert",
            alert: {
              color: "error",
              variant: "filled",
            },
            transition: "Fade",
            close: true,
            actionButton: false,
            maxStack: 3,
            dense: false,
            iconVariant: "usedefault",
          });
          return;
        } else {
          openSnackbar({
            action: false,
            open: true,
            message:
              "Customer could not be added successfully. Please try again.",
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            variant: "alert",
            alert: {
              color: "error",
              variant: "filled",
            },
            transition: "Fade",
            close: true,
            actionButton: false,
            maxStack: 3,
            dense: false,
            iconVariant: "usedefault",
          });
          return;
        }
      }

      const newInvoice: InvoiceSupabase = {
        invoice_number: values.invoice_number,
        customer_id: customerToAdd,
        quotation_id: selectedQuotation?.id,
        total: totalAmount,
        invoice_date: new Date(values.invoice_date),
        note: values.note,
        status: "draft",
      };

      const invoicesRepo = new InvoicesRepository();
      const createdInvoice = await invoicesRepo.create(newInvoice);

      if (createdInvoice) {
        // Add items to invoice
        for (const item of selectedItems) {
          await invoicesRepo.addItem({
            invoice_id: createdInvoice.id,
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          });

          // COMMIT STOCK (Immediate reduction for invoices)
          const stocksRepo = new StocksRepository();
          // const result = await stocksRepo.commitForInvoice(
          //   item.item_id,
          //   1, // default warehouse
          //   item.quantity,
          //   createdInvoice.id
          // );
          const result = { success: false, error: false }; // TODO: temporary for fixing build erro, original is above

          if (!result.success) {
            // If stock commit fails, show error and rollback
            await invoicesRepo.delete([createdInvoice.id]);
            openSnackbar({
              action: false,
              open: true,
              message: `Failed to allocate stock for item ${item.name}. ${result.error}`,
              anchorOrigin: { vertical: "bottom", horizontal: "right" },
              variant: "alert",
              alert: {
                color: "error",
                variant: "filled",
              },
              transition: "Fade",
              close: true,
              actionButton: false,
              maxStack: 3,
              dense: false,
              iconVariant: "usedefault",
            });
            return;
          }
        }

        // If this invoice was created from a quotation, update quotation status
        if (selectedQuotation) {
          const quotationsRepo = new QuotationsRepository();
          // await quotationsRepo.updateStatus(selectedQuotation.id, 'converted');
          openSnackbar({
            action: false,
            open: true,
            message: `Quotation #${selectedQuotation.quotation_number} marked as converted`,
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            variant: "alert",
            alert: {
              color: "info",
              variant: "filled",
            },
            transition: "Fade",
            close: true,
            actionButton: false,
            maxStack: 3,
            dense: false,
            iconVariant: "usedefault",
          });
        }

        openSnackbar({
          action: false,
          open: true,
          message: "Invoice created successfully. Stock has been committed.",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "success",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
          maxStack: 3,
          dense: false,
          iconVariant: "usedefault",
        });

        navigate("/invoices");
      } else {
        openSnackbar({
          action: false,
          open: true,
          message: "Invoice could not be created. Please try again.",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "error",
            variant: "filled",
          },
          transition: "Fade",
          close: true,
          actionButton: false,
          maxStack: 3,
          dense: false,
          iconVariant: "usedefault",
        });
      }
    } catch (e) {
      console.error("Error creating invoice:", e);
      openSnackbar({
        action: false,
        open: true,
        message: "Invoice could not be created. Please try again.",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        variant: "alert",
        alert: {
          color: "error",
          variant: "filled",
        },
        transition: "Fade",
        close: true,
        actionButton: false,
        maxStack: 3,
        dense: false,
        iconVariant: "usedefault",
      });
    }
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

  async function getItems() {
    const itemsRepository = new ItemsRepository();
    const allItems = await itemsRepository.getWithoutFilters();
    if (allItems?.itemsData) {
      setItems(allItems.itemsData);
    }
  }

  async function getQuotations() {
    const quotationsRepo = new QuotationsRepository();
    const allQuotations = await quotationsRepo.getWithoutFilters();
    if (allQuotations?.quotationsData) {
      // Filter only non-converted quotations
      const activeQuotations = allQuotations.quotationsData.filter(
        (q: any) => q.status !== "converted" && q.status !== "cancelled"
      );
      setQuotations(activeQuotations);
    }
  }

  async function loadData() {
    setLoading(true);
    await Promise.all([getCustomers(), getItems(), getQuotations()]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
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
    items,
    quotations,
    loading,
    selectedItems,
    addItem,
    removeItem,
    updateItem,
    totalAmount,
    handleSearchDebounced,
    loadingCustomers,
    createInlineCustomer,
    setCreateInlineCustomer,
    selectedAddress,
    selectedSuburb,
    selectedState,
    selectedEmail,
    selectedPhone,
    selectedMobile,
    selectedPostCode,
    setSelectedCustomer,
    changeAddress,
    setSelectedSuburb,
    setSelectedState,
    setSelectedEmail,
    setSelectedPhone,
    setSelectedMobile,
    setSelectedPostCode,
    selectedCustomer,
    loadFromQuotation,
    selectedQuotation,
    isQuotationLoaded,
    setIsQuotationLoaded,
    setSelectedItems,
  };
}
