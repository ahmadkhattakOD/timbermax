import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  parseAddress,
  stateAbbreviations,
  useDebouncedSearch,
  calculateItemTotal,
  calculateSubTotal,
} from "utils/helpers";
import { geocodeByPlaceId } from "react-google-places-autocomplete";
import { openSnackbar } from "api/snackbar";
import CustomersRepository, {
  CustomerSupabase,
  CustomerAddress,
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import InvoicesRepository, {
  InvoiceSupabase,
} from "utils/repositories/invoicesRepository";
import QuotationsRepository from "utils/repositories/quotationRepo";
import { SnackbarProps } from "types/snackbar";
import { useSearchParams } from "react-router-dom";
import StocksRepository from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";
import supabase from "utils/supabase";

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
  due_date: string;
  note: string;
  quotation_id: string;
}

export interface InvoiceItem {
  item_id: number;
  name: string;
  itemCode: string;
  quantity: string;
  unit_price: number;
  gst: boolean;
  total: string;
  warehouse_id?: number;
  available_warehouses: Array<{
    id: number;
    name: string;
    quantity: number;
    reserved: number;
    available: number;
  }>;
}

// Interface for customer address with selection
export interface CustomerAddressWithSelection extends CustomerAddress {
  id?: number;
  displayText?: string;
}

export function useCreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
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
  const [quotationSearch, setQuotationSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [createInlineCustomer, setCreateInlineCustomer] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isQuotationLoaded, setIsQuotationLoaded] = useState(false);
  const [inlineCustomerName, setInlineCustomerName] = useState("");
  const [customerName, setCustomerName] = useState<string>("");

  // New states for customer addresses
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddressWithSelection[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(-1);
  const [selectedAddressDetails, setSelectedAddressDetails] = useState({
    address: '',
    suburb: '',
    state: '',
    post_code: '',
  });

  // Discount state
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + calculateSubTotal(item),
    0,
  );

  // Calculate final amount after discount
  const discountAmount =
    discountType === "percentage"
      ? (totalAmount * discount) / 100
      : Math.min(discount, totalAmount);
  const finalAmount = totalAmount - discountAmount;

  const customerIdFromUrl = searchParams.get("customer");

  // Function to get ALL warehouses for an item (including those with 0 or negative stock)
  const getWarehousesForItem = async (itemId: number) => {
    try {
      // First get all warehouses
      const warehousesRepo = new WarehousesRepository();
      const allWarehouses = await warehousesRepo.getWithoutFilters();

      if (!allWarehouses?.warehousesData) {
        return [];
      }

      // Get stock data for this item in all warehouses
      const { data: stockData, error } = await supabase
        .from("stocks")
        .select(
          `
          id,
          quantity,
          reserved,
          warehouse
        `,
        )
        .eq("item", itemId);

      if (error) {
        console.error("Error fetching stock for item:", error);
        // Return all warehouses with 0 stock if no stock records exist
        return allWarehouses.warehousesData.map((warehouse) => ({
          id: warehouse.id,
          name: warehouse.name,
          quantity: 0,
          reserved: 0,
          available: 0,
        }));
      }

      // Create a map of warehouse stock
      const stockByWarehouse = new Map();
      if (stockData) {
        stockData.forEach((stock) => {
          stockByWarehouse.set(stock.warehouse, {
            quantity: parseFloat(stock.quantity) || 0,
            reserved: parseFloat(stock.reserved) || 0,
            available:
              (parseFloat(stock.quantity) || 0) -
              (parseFloat(stock.reserved) || 0),
          });
        });
      }

      // Return all warehouses with their stock data (0 if no stock record)
      return allWarehouses.warehousesData.map((warehouse) => {
        const stockInfo = stockByWarehouse.get(warehouse.id);
        if (stockInfo) {
          return {
            id: warehouse.id,
            name: warehouse.name,
            quantity: stockInfo.quantity,
            reserved: stockInfo.reserved,
            available: stockInfo.available,
          };
        } else {
          return {
            id: warehouse.id,
            name: warehouse.name,
            quantity: 0,
            reserved: 0,
            available: 0,
          };
        }
      });
    } catch (error) {
      console.error("Error getting warehouses for item:", error);
      return [];
    }
  };

  // Function to fetch customer addresses
  const fetchCustomerAddresses = useCallback(async (customerId: number) => {
    try {
      const customersRepo = new CustomersRepository();
      const customerResponse = await customersRepo.getSingle(customerId);

      if (customerResponse?.customerData) {
        const customer = customerResponse.customerData;
        let addresses: CustomerAddressWithSelection[] = [];

        // Check if addresses array exists
        if (customer.addresses && customer.addresses.length > 0) {
          addresses = customer.addresses.map((addr: CustomerAddress, index: number) => ({
            ...addr,
            id: index,
            displayText: `${addr.address}, ${addr.suburb} ${addr.state} ${addr.post_code} ${addr.is_primary ? '(Primary)' : ''}`
          }));
        } else {
          // Fallback to individual fields for backward compatibility
          if (customer.address) {
            addresses.push({
              address: customer.address || '',
              suburb: customer.suburb || '',
              state: customer.state || '',
              post_code: customer.post_code || '',
              is_primary: true,
              id: 0,
              displayText: `${customer.address || ''}, ${customer.suburb || ''} ${customer.state || ''} ${customer.post_code || ''} (Primary)`
            });
          }
        }

        setCustomerAddresses(addresses);

        // Automatically select the primary address if available
        const primaryIndex = addresses.findIndex(addr => addr.is_primary);
        if (primaryIndex !== -1) {
          setSelectedAddressIndex(primaryIndex);
          setSelectedAddressDetails({
            address: addresses[primaryIndex].address,
            suburb: addresses[primaryIndex].suburb,
            state: addresses[primaryIndex].state,
            post_code: addresses[primaryIndex].post_code,
          });
        } else if (addresses.length > 0) {
          setSelectedAddressIndex(0);
          setSelectedAddressDetails({
            address: addresses[0].address,
            suburb: addresses[0].suburb,
            state: addresses[0].state,
            post_code: addresses[0].post_code,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
      setCustomerAddresses([]);
      setSelectedAddressIndex(-1);
      setSelectedAddressDetails({
        address: '',
        suburb: '',
        state: '',
        post_code: '',
      });
    }
  }, []);

  // Handle address selection
  const handleAddressSelect = (index: number) => {
    if (index >= 0 && index < customerAddresses.length) {
      setSelectedAddressIndex(index);
      const selectedAddr = customerAddresses[index];
      const newAddressDetails = {
        address: selectedAddr.address,
        suburb: selectedAddr.suburb,
        state: selectedAddr.state,
        post_code: selectedAddr.post_code,
      };

      setSelectedAddressDetails(newAddressDetails);
      setSelectedAddress(selectedAddr.address);
      setSelectedSuburb(selectedAddr.suburb);
      setSelectedState(selectedAddr.state);
      setSelectedPostCode(selectedAddr.post_code);
    }
  };

  // Function to load customer data by ID
  const loadCustomerById = async (customerId: number) => {
    try {
      setLoading(true);
      const customersRepository = new CustomersRepository();
      const customerData = await customersRepository.getSingle(customerId);
      if (customerData) {
        const customer = customerData.customerData;
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

  async function changeAddress(
    newValue: any,
    actionMeta: any,
    setFieldValue?: (field: string, value: any) => void,
  ) {
    const description = newValue?.value?.description ?? "";
    let suburb = "";
    let state = "";
    let postCode = "";

    // Use Google Places Details API for accurate address components
    if (newValue?.value?.place_id) {
      try {
        const results = await geocodeByPlaceId(newValue.value.place_id);
        const components = results[0]?.address_components ?? [];

        suburb =
          components.find((c: any) => c.types.includes("locality"))?.long_name ||
          components.find((c: any) => c.types.includes("sublocality_level_1"))?.long_name ||
          "";

        const stateShort =
          components.find((c: any) =>
            c.types.includes("administrative_area_level_1"),
          )?.short_name ?? "";
        // Map abbreviation (e.g. "VIC") to full name (e.g. "Victoria")
        state =
          stateAbbreviations[stateShort as keyof typeof stateAbbreviations] ||
          stateShort;

        postCode =
          components.find((c: any) => c.types.includes("postal_code"))
            ?.long_name ?? "";
      } catch (e) {
        // Fallback to text parsing if geocoding fails
        const parsed = parseAddress(description);
        suburb = parsed.suburb;
        state = parsed.state;
      }
    } else {
      const parsed = parseAddress(description);
      suburb = parsed.suburb;
      state = parsed.state;
    }

    if (selectedCustomer && selectedAddressIndex !== -1 && customerAddresses.length > 0) {
      const newAddressDetails = {
        address: description,
        suburb,
        state,
        post_code: postCode,
      };
      setSelectedAddressDetails(newAddressDetails);
      const updatedAddresses = [...customerAddresses];
      updatedAddresses[selectedAddressIndex] = {
        ...updatedAddresses[selectedAddressIndex],
        ...newAddressDetails,
      };
      setCustomerAddresses(updatedAddresses);
    } else {
      setSelectedSuburb(suburb);
      setSelectedState(state);
      setSelectedPostCode(postCode);
      setSelectedAddress(description);
      setSelectedAddressDetails({
        address: description,
        suburb,
        state,
        post_code: postCode,
      });
    }

    // Always update Formik fields directly so the form reflects the new values
    if (setFieldValue) {
      setFieldValue("suburb", suburb);
      setFieldValue("state", state);
      setFieldValue("postCode", postCode);
    }
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

  function handleQuotationSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuotationSearch(e.target.value);
  }

  const handleQuotationSearchDebounced = useDebouncedSearch(handleQuotationSearchChange);

  function resetCustomerData() {
    setSelectedEmail("");
    setSelectedPhone("");
    setSelectedMobile("");
    setSelectedAddress("");
    setSelectedSuburb("");
    setSelectedState("");
    setSelectedPostCode("");
    setSelectedAddressDetails({
      address: '',
      suburb: '',
      state: '',
      post_code: '',
    });
    setCustomerAddresses([]);
    setSelectedAddressIndex(-1);
  }

  const addItem = async (itemId: number) => {
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
        newQuantity * Number(updatedItems[existingIndex].unit_price)
      ).toString();
      setSelectedItems(updatedItems);
    } else {
      // Get ALL warehouses for this item (including those with 0 stock)
      const allWarehouses = await getWarehousesForItem(itemId);

      if (allWarehouses.length === 0) {
        openSnackbar({
          open: true,
          message: `No warehouses found for item "${item.name}"`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      // Sort warehouses by available stock (highest first)
      const sortedWarehouses = [...allWarehouses].sort(
        (a, b) => b.available - a.available,
      );

      // Auto-select warehouse with highest available stock (even if it's 0 or negative)
      const selectedWarehouse = sortedWarehouses[0].id;

      // Add new item with ALL warehouses
      const newItem: InvoiceItem = {
        item_id: item.id,
        name: item.name,
        itemCode: item.itemCode,
        quantity: "1",
        unit_price: item?.sellPrice || 0,
        gst: item?.gst || false,
        total: item?.sellPrice.toString() || "0",
        warehouse_id: selectedWarehouse, // Auto-select first (highest stock)
        available_warehouses: sortedWarehouses,
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
    } else if (field === "warehouse_id") {
      updatedItems[index].warehouse_id = value;
    }

    // Recalculate total for the item including GST
    const quantity = parseFloat(updatedItems[index].quantity);
    const unit_price = Number(updatedItems[index].unit_price);
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

        // populate discount values from quotation
        const quoteDiscount = quotation.quotationData.discount || 0;
        const quoteDiscountType: "percentage" | "fixed" =
          quotation.quotationData.discount_type || "percentage";
        setDiscount(quoteDiscount);
        setDiscountType(quoteDiscountType);
        // show the discount input if there's a value
        if (quoteDiscount > 0) {
          setShowDiscountInput(true);
        }

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
          const itemsWithWarehouses = await Promise.all(
            itemsData.data.map(async (item: any) => {
              const allWarehouses = await getWarehousesForItem(item.item_id);
              const sortedWarehouses = [...allWarehouses].sort(
                (a, b) => b.available - a.available,
              );

              return {
                item_id: item.item_id,
                name: item.items?.name,
                itemCode: item.items?.itemCode,
                quantity: item.quantity,
                unit_price: item.unit_price,
                gst: item.items?.gst || false,
                total: item.total_price,
                warehouse_id:
                  sortedWarehouses.length > 0
                    ? sortedWarehouses[0].id
                    : undefined,
                available_warehouses: sortedWarehouses,
              };
            }),
          );

          setSelectedItems(itemsWithWarehouses);

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

    if (!values.due_date) {
      errors.due_date = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateInvoice) {
    try {
      // ✅ ALLOW invoices even if stock is 0 or negative
      // Just show warnings but don't prevent submission

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

      // Customer creation logic
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

      // Use selected address details for the invoice snapshot
      const invoiceAddress = selectedCustomer && customerAddresses.length > 0 && selectedAddressIndex !== -1
        ? selectedAddressDetails
        : {
            address: values.address,
            suburb: values.suburb,
            state: values.state,
            post_code: values.postCode,
          };

      const newInvoice: InvoiceSupabase = {
        invoice_number: values.invoice_number,
        customer_id: customerToAdd,
        quotation_id: selectedQuotation?.id || null,
        total: finalAmount,
        invoice_date: new Date(values.invoice_date),
        due_date: values.due_date ? new Date(values.due_date) : undefined,
        note: values.note,
        status: "draft",
        discount: discount,
        discount_type: discountType,
        // Save address snapshot to invoice
        address: invoiceAddress.address,
        suburb: invoiceAddress.suburb,
        state: invoiceAddress.state,
        post_code: invoiceAddress.post_code,
      };

      const invoicesRepo = new InvoicesRepository();

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
          const itemUnitPrice = Number(item.unit_price);
          const warehouseId = item.warehouse_id || 1; // Get warehouse_id

          await invoicesRepo.addItem({
            invoice_id: invoiceId,
            item_id: item.item_id,
            quantity: itemQuantity,
            unit_price: itemUnitPrice,
            warehouse_id: warehouseId,
          });
        }

        // 3. TRANSFER RESERVED STOCK from quotation to invoice
        const stocksRepo = new StocksRepository();
        const transferResult = await stocksRepo.transferReservedStockToInvoice(
          selectedQuotation.id,
          invoiceId,
        );

        if (!transferResult.success) {
          console.error("Stock transfer failed:", transferResult.error);
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

        // Prepare items for stock reduction with warehouse IDs
        const itemsForStockReduction = selectedItems.map((item) => ({
          item_id: item.item_id,
          quantity: parseFloat(item.quantity),
          warehouse_id: item.warehouse_id || 1,
          unit_price: Number(item.unit_price),
        }));

        // Check for low/negative stock items to show warning
        const lowStockItems = selectedItems.filter((item) => {
          if (item.warehouse_id) {
            const selectedWarehouse = item.available_warehouses.find(
              (w) => w.id === item.warehouse_id,
            );
            const requestedQuantity = parseFloat(item.quantity);
            return (
              selectedWarehouse &&
              requestedQuantity > selectedWarehouse.available
            );
          }
          return false;
        });

        if (lowStockItems.length > 0) {
          const warningMessage = `Invoice will create NEGATIVE stock for: ${lowStockItems
            .map(
              (item) =>
                `${item.name} (${item.quantity} > ${item.available_warehouses.find((w) => w.id === item.warehouse_id)?.available || 0} available)`,
            )
            .join(", ")}`;

          console.warn("Low stock warning:", warningMessage);
          // Don't prevent submission, just log warning
        }

        // Create invoice with warehouse-specific stock reduction
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
        // for (const item of selectedItems) {
        //   const itemQuantity = parseFloat(item.quantity);
        //   const itemUnitPrice = Number(item.unit_price);
        //   const warehouseId = item.warehouse_id || 1;

        //   await invoicesRepo.addItem({
        //     invoice_id: result.invoice.id,
        //     item_id: item.item_id,
        //     quantity: itemQuantity,
        //     unit_price: itemUnitPrice,
        //     warehouse_id: warehouseId,
        //   });
        // }

        // Show success message with warning if low stock
        if (lowStockItems.length > 0) {
          openSnackbar({
            open: true,
            message: `Invoice created successfully! ⚠️ ${lowStockItems.length} item(s) will have negative stock.`,
            variant: "alert",
            alert: { color: "warning" },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message: "Invoice created successfully.",
            variant: "alert",
            alert: { color: "success" },
          } as SnackbarProps);
        }
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
    setLoadingQuotations(true);
    const quotationsRepo = new QuotationsRepository();

    // If there's a search term, use filtered search
    if (quotationSearch.trim()) {
      // Search by both quotation number and customer name, then merge results
      const searchTerm = quotationSearch.trim();

      // Search by quotation number
      const resultByNumber = await quotationsRepo.get(
        "created_at",
        false,
        0,
        99,
        100,
        {
          quotation_number: searchTerm,
        }
      );

      // Search by customer name
      const resultByCustomer = await quotationsRepo.get(
        "created_at",
        false,
        0,
        99,
        100,
        {
          customer_name: searchTerm,
        }
      );

      // Merge results and remove duplicates
      const allResults = [
        ...(resultByNumber?.quotationsData || []),
        ...(resultByCustomer?.quotationsData || []),
      ];

      // Remove duplicates by id
      const uniqueQuotations = allResults.filter(
        (q, index, self) => index === self.findIndex((t) => t.id === q.id)
      );

      // Filter only non-converted quotations
      const activeQuotations = uniqueQuotations.filter(
        (q: any) => q.status !== "converted" && q.status !== "cancelled",
      );

      setQuotations(activeQuotations);
    } else {
      // Load all without search
      const allQuotations = await quotationsRepo.getWithoutFilters();
      if (allQuotations?.quotationsData) {
        // Filter only non-converted quotations
        const activeQuotations = allQuotations.quotationsData.filter(
          (q: any) => q.status !== "converted" && q.status !== "cancelled",
        );
        setQuotations(activeQuotations);
      }
    }
    setLoadingQuotations(false);
  }

  async function getAllWarehouses() {
    const warehousesRepo = new WarehousesRepository();
    const allWarehouses = await warehousesRepo.getWithoutFilters();
    if (allWarehouses?.warehousesData) {
      setWarehouses(allWarehouses.warehousesData);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([
        getCustomers(),
        getItems(),
        getQuotations(),
        getAllWarehouses(),
      ]);
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
    getQuotations();
  }, [quotationSearch]);

  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find((c) => c.id === selectedCustomer);
      if (customer) {
        setSelectedEmail(customer.email || "");
        setCustomerName(customer.name || "");
        setSelectedPhone(customer.phone || "");
        setSelectedMobile(customer.mobile || "");

        // Fetch addresses for the selected customer
        fetchCustomerAddresses(selectedCustomer);
      }
    } else if (!createInlineCustomer) {
      resetCustomerData();
    }
  }, [selectedCustomer, customers, createInlineCustomer, fetchCustomerAddresses]);

  // Update selected address fields when address details change
  useEffect(() => {
    if (selectedCustomer && customerAddresses.length > 0 && selectedAddressIndex !== -1) {
      const selectedAddr = customerAddresses[selectedAddressIndex];
      setSelectedAddress(selectedAddr.address);
      setSelectedSuburb(selectedAddr.suburb);
      setSelectedState(selectedAddr.state);
      setSelectedPostCode(selectedAddr.post_code);
    }
  }, [selectedAddressIndex, customerAddresses, selectedCustomer]);

  return {
    validate,
    onSubmit,
    customers,
    items,
    warehouses,
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
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    selectedAddressDetails,
    handleAddressSelect,
    setSelectedAddressDetails,
    // Discount properties
    discount,
    setDiscount,
    discountType,
    setDiscountType,
    showDiscountInput,
    setShowDiscountInput,
    discountAmount,
    finalAmount,
    // Quotation search properties
    handleQuotationSearchDebounced,
    loadingQuotations,
  };
}
