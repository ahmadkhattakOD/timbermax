import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  parseAddress,
  useDebouncedSearch,
  calculateItemTotal,
} from "utils/helpers";
import { openSnackbar } from "api/snackbar";
import CustomersRepository, {
  CustomerSupabase,
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import InvoicesRepository, {
  InvoiceSupabase,
} from "utils/repositories/invoicesRepository";
import QuotationsRepository from "utils/repositories/quotationRepo";
import { SnackbarProps } from "types/snackbar";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
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
  const [itemSearch, setItemSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [createInlineCustomer, setCreateInlineCustomer] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isQuotationLoaded, setIsQuotationLoaded] = useState(false);
  const [inlineCustomerName, setInlineCustomerName] = useState("");
  const [customerName, setCustomerName] = useState<string>("");
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0,
  );

  const customerIdFromUrl = searchParams.get("customer");

  // Function to load customer data by ID
  const loadCustomerById = async (customerId: number) => {
    try {
      setLoading(true);
      const customersRepository = new CustomersRepository();
      const customerData = await customersRepository.getSingle(customerId);
      if (customerData) {
        const customer = customerData.customerData;
        console.log("Customer details", customer);
        // Set customer details
        setSelectedCustomer(customerId);
        setCustomerName(customer.name || "");
        setSelectedEmail(customer.email || "");
        setSelectedPhone(customer.phone || "");
        setSelectedMobile(customer.mobile || "");
        setSelectedAddress(customer.address || "");
        setSelectedSuburb(customer.suburb || "");
        setSelectedState(customer.state || "");
        setSelectedPostCode(customer.post_code || "");

        // Add customer to the list if not already there
        if (!customers.find((c) => c.id === customerId)) {
          setCustomers((prev) => [...prev, customer]);
        }

        openSnackbar({
          open: true,
          message: `Customer "${customer.name}" loaded from URL`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
      } else {
        openSnackbar({
          open: true,
          message: `Customer with ID ${customerId} not found`,
          variant: "alert",
          alert: { color: "warning" },
        } as SnackbarProps);
      }
    } catch (error) {
      console.error("Error loading customer from URL:", error);
      openSnackbar({
        open: true,
        message: "Failed to load customer data from URL",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    } finally {
      setLoading(false);
    }
  };

  function changeAddress(newValue: any, actionMeta: any) {
    let addressComponents = parseAddress(newValue?.value?.description ?? "");
    setSelectedSuburb(addressComponents.suburb);
    setSelectedState(addressComponents.state);
    setSelectedAddress(newValue?.value?.description ?? "");
  }

  const setCreateInlineCustomerWithReset = (value: boolean) => {
    setCreateInlineCustomer(value);
    if (!value) {
      setInlineCustomerName("");
    }
  };

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomerSearch(e.target.value);
  }

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

  function handleItemSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setItemSearch(e.target.value);
  }

  const handleItemSearchDebounced = useDebouncedSearch(handleItemSearchChange);

  function resetCustomerData() {
    setSelectedEmail("");
    setSelectedPhone("");
    setSelectedMobile("");
    setSelectedAddress("");
    setSelectedSuburb("");
    setSelectedState("");
    setSelectedPostCode("");
  }

  const addItem = (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Check if item already exists in selected items
    const existingIndex = selectedItems.findIndex((i) => i.item_id === itemId);

    if (existingIndex !== -1) {
      // Update existing item quantity
      const updatedItems = [...selectedItems];
      const newQuantity = parseFloat(updatedItems[existingIndex].quantity) + 1;

      updatedItems[existingIndex].quantity = newQuantity.toString();
      updatedItems[existingIndex].total = (
        newQuantity * parseFloat(updatedItems[existingIndex].unit_price)
      ).toString();
      setSelectedItems(updatedItems);
    } else {
      // Add new item with GST information
      const newItem = {
        item_id: item.id,
        name: item.name,
        itemCode: item.itemCode,
        quantity: "1",
        unit_price: item?.sellPrice || 0,
        gst: item?.gst || false,
        total: item?.sellPrice.toString() || "0",
      };
      setSelectedItems([...selectedItems, newItem]);
    }

    // Reset selection
    setSelectedItemId(null);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...selectedItems];

    if (field === "quantity") {
      const newQuantity = parseFloat(value);

      if (newQuantity < 1) {
        openSnackbar({
          open: true,
          message: "Quantity must be at least 1",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      updatedItems[index].quantity = value;
    } else if (field === "unit_price") {
      updatedItems[index].unit_price = value;
    }

    // Recalculate total for the item including GST
    const quantity = parseFloat(updatedItems[index].quantity);
    const unit_price = parseFloat(updatedItems[index].unit_price);
    const baseTotal = quantity * unit_price;
    const gstAmount = updatedItems[index].gst ? baseTotal * 0.1 : 0;

    updatedItems[index].total = (baseTotal + gstAmount).toString();
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

        // Load customer details
        if (quotation.quotationData.customers) {
          setSelectedCustomer(quotation.quotationData.customers.id);
          setSelectedEmail(quotation.quotationData.customers.email || "");
          setSelectedPhone(quotation.quotationData.customers.phone || "");
          setCustomerName(quotation.quotationData.customers.name || "");
          setSelectedMobile(quotation.quotationData.customers.mobile || "");
          setSelectedAddress(quotation.quotationData.customers.address || "");
          setSelectedSuburb(quotation.quotationData.customers.suburb || "");
          setSelectedState(quotation.quotationData.customers.state || "");
          setSelectedPostCode(
            quotation.quotationData.customers.post_code || "",
          );
        }

        // Load items with GST information
        const itemsData = await quotationsRepo.getItems(quotationId);
        if (itemsData?.data) {
          setSelectedItems(
            itemsData.data.map((item: any) => ({
              item_id: item.item_id,
              name: item.items?.name,
              itemCode: item.items?.itemCode,
              quantity: item.quantity,
              unit_price: item.unit_price,
              gst: item.items?.gst || false,
              total: item.total_price,
            })),
          );

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
    const errors: Partial<ValuesCreateInvoice> = {};

    if (!values.invoice_number) {
      errors.invoice_number = "required";
    }

    if (!createInlineCustomer) {
      // In existing customer mode, check contactName
      if (!values.contactName || !values.contactName.trim()) {
        errors.contactName = "required";
      }
    } else {
      // In inline creation mode, check inlineCustomerName
      if (!values.inlineCustomerName || !values.inlineCustomerName.trim()) {
        errors.inlineCustomerName = "required";
      }
    }

    if (!values.invoice_date) {
      errors.invoice_date = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateInvoice) {
    try {
      let customerToAdd;

      if (selectedItems.length === 0) {
        openSnackbar({
          open: true,
          message: "Please add at least one item to the invoice",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      const customersRepository = new CustomersRepository();

      // Customer creation logic (keep as is)
      if (createInlineCustomer) {
        // Create new customer from inline form
        const newCustomer: CustomerSupabase = {
          name: values.inlineCustomerName,
          phone: values.phone,
          mobile: values.mobile,
          address: values.address,
          suburb: values.suburb,
          state: values.state,
          post_code: values.postCode,
          email: values.emailAddress,
        };

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
      } else {
        // For existing customer mode
        if (selectedCustomer) {
          customerToAdd = selectedCustomer;
        } else {
          // No customer selected, find or create by name
          const customerNameToUse = values.contactName;

          // First, try to find existing customer by name
          const existingCustomers =
            await customersRepository.getByName(customerNameToUse);
          let existingCustomer = null;

          if (existingCustomers?.customersData) {
            existingCustomer = existingCustomers.customersData.find(
              (c: any) => c.name === customerNameToUse,
            );
          }

          if (existingCustomer) {
            // Customer exists, use it
            customerToAdd = existingCustomer.id;
          } else {
            // Customer doesn't exist, create new one
            const newCustomer: CustomerSupabase = {
              name: customerNameToUse,
              phone: values.phone,
              mobile: values.mobile,
              address: values.address,
              suburb: values.suburb,
              state: values.state,
              post_code: values.postCode,
              email: values.emailAddress,
            };

            const createdCustomer =
              await customersRepository.create(newCustomer);
            if (createdCustomer) {
              customerToAdd = createdCustomer.id;
            } else if (createdCustomer === false) {
              openSnackbar({
                open: true,
                message:
                  "Another customer already exists with the same name and address. Please use a different name.",
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
        }
      }

      const newInvoice: InvoiceSupabase = {
        invoice_number: values.invoice_number,
        customer_id: customerToAdd,
        quotation_id: selectedQuotation?.id || null,
        total: totalAmount,
        invoice_date: new Date(values.invoice_date),
        note: values.note,
        status: "draft",
      };

      const invoicesRepo = new InvoicesRepository();
      const stocksRepo = new StocksRepository();

      if (selectedQuotation) {
        // ============================================
        // CASE 1: Creating invoice FROM QUOTATION
        // ============================================

        // 1. Create the invoice first
        const createdInvoice = await invoicesRepo.create(newInvoice);

        if (!createdInvoice) {
          openSnackbar({
            open: true,
            message: "Failed to create invoice",
            variant: "alert",
            alert: { color: "error" },
          } as SnackbarProps);
          return;
        }

        const invoiceId = createdInvoice.id;

        // 2. Add invoice items
        for (const item of selectedItems) {
          const itemQuantity = parseFloat(item.quantity);
          const itemUnitPrice = parseFloat(item.unit_price);

          await invoicesRepo.addItem({
            invoice_id: invoiceId,
            item_id: item.item_id,
            quantity: itemQuantity,
            unit_price: itemUnitPrice,
          });
        }

        // 3. TRANSFER RESERVED STOCK from quotation to invoice
        // This will:
        //   a) Release the reservations from the quotation
        //   b) Reduce the actual stock quantity
        const transferResult = await stocksRepo.transferReservedStockToInvoice(
          selectedQuotation.id,
          invoiceId,
        );

        if (!transferResult.success) {
          console.error("Stock transfer failed:", transferResult.error);

          // Optional: Rollback the invoice creation
          // await invoicesRepo.delete([invoiceId]);

          openSnackbar({
            open: true,
            message: `Invoice created but stock transfer failed: ${transferResult.error}. Please check stock manually.`,
            variant: "alert",
            alert: { color: "warning" },
          } as SnackbarProps);
        }

        // 4. Update quotation status to "converted"
        const quotationsRepo = new QuotationsRepository();
        const statusUpdate = await quotationsRepo.updateStatus(
          selectedQuotation.id,
          "converted",
        );

        if (!statusUpdate.success) {
          console.warn(
            "Failed to update quotation status:",
            statusUpdate.error,
          );
          // Continue anyway since invoice is created
        }

        openSnackbar({
          open: true,
          message: `Invoice created from quotation. ${transferResult.transferred || 0} items transferred from reserved stock.`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
      } else {
        // ============================================
        // CASE 2: Creating REGULAR invoice (not from quotation)
        // ============================================

        // Prepare items for stock reduction
        const itemsForStockReduction = selectedItems.map((item) => ({
          item_id: item.item_id,
          quantity: parseFloat(item.quantity),
        }));

        // Create invoice with immediate stock reduction
        const result = await invoicesRepo.createWithStockReduction(
          newInvoice,
          itemsForStockReduction,
        );

        if (!result.success) {
          openSnackbar({
            open: true,
            message: `Invoice creation failed: ${result.error}`,
            variant: "alert",
            alert: { color: "error" },
          } as SnackbarProps);
          return;
        }

        // Add invoice items
        for (const item of selectedItems) {
          const itemQuantity = parseFloat(item.quantity);
          const itemUnitPrice = parseFloat(item.unit_price);

          await invoicesRepo.addItem({
            invoice_id: result.invoice.id,
            item_id: item.item_id,
            quantity: itemQuantity,
            unit_price: itemUnitPrice,
          });
        }

        openSnackbar({
          open: true,
          message: "Invoice created successfully. Stock has been reduced.",
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
      }

      // Navigate to invoices page
      navigate("/invoices");
    } catch (e: any) {
      console.error("Error creating invoice:", e);
      openSnackbar({
        open: true,
        message: `Invoice could not be created: ${e.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }
  }

  // Load customer from URL when component mounts
  useEffect(() => {
    const loadCustomerFromUrl = async () => {
      if (customerIdFromUrl) {
        const customerId = parseInt(customerIdFromUrl);
        if (customerId && !isNaN(customerId)) {
          await loadCustomerById(customerId);
        }
      }
    };

    loadCustomerFromUrl();
  }, [customerIdFromUrl]);

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
    setLoadingItems(true);
    const itemsRepository = new ItemsRepository();
    const allItems = await itemsRepository.getByName(itemSearch || "");
    if (allItems?.itemsData) {
      setItems(allItems.itemsData);
    }
    setLoadingItems(false);
  }

  async function getQuotations() {
    const quotationsRepo = new QuotationsRepository();
    const allQuotations = await quotationsRepo.getWithoutFilters();
    if (allQuotations?.quotationsData) {
      // Filter only non-converted quotations
      const activeQuotations = allQuotations.quotationsData.filter(
        (q: any) => q.status !== "converted" && q.status !== "cancelled",
      );
      setQuotations(activeQuotations);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([getCustomers(), getItems(), getQuotations()]);
    } catch (error) {
      console.error("Error loading data:", error);
    }
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
    getItems();
  }, [itemSearch]);

  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find((c) => c.id === selectedCustomer);
      if (customer) {
        setSelectedEmail(customer.email || "");
        setCustomerName(customer.name || "");
        setSelectedPhone(customer.phone || "");
        setSelectedMobile(customer.mobile || "");
        setSelectedAddress(customer.address || "");
        setSelectedSuburb(customer.suburb || "");
        setSelectedState(customer.state || "");
        setSelectedPostCode(customer.post_code || "");
      }
    } else if (!createInlineCustomer) {
      resetCustomerData();
    }
  }, [selectedCustomer, customers, createInlineCustomer]);

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
    selectedAddress,
    selectedSuburb,
    selectedState,
    selectedEmail,
    selectedPhone,
    selectedMobile,
    selectedPostCode,
    setSelectedCustomer,
    changeAddress,
    selectedCustomer,
    loadFromQuotation,
    selectedQuotation,
    isQuotationLoaded,
    setIsQuotationLoaded,
    setSelectedItems,
    handleItemSearchDebounced,
    loadingItems,
    selectedItemId,
    setSelectedItemId,
    setCreateInlineCustomer: setCreateInlineCustomerWithReset,
    inlineCustomerName,
    setInlineCustomerName,
    customerName,
    setCustomerName,
  };
}
