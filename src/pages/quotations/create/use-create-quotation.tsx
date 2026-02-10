import { openSnackbar } from "api/snackbar";
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  calculateItemTotal,
  calculateSubTotal,
  parseAddress,
  useDebouncedSearch,
} from "utils/helpers";
import CustomersRepository, {
  CustomerSupabase,
  CustomerAddress,
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import QuotationsRepository, {
  QuotationSupabase,
} from "utils/repositories/quotationRepo";
import WarehousesRepository from "utils/repositories/warehousesRepository";
import supabase from "utils/supabase";

export interface ValuesCreateQuotation {
  quotation_number: string;
  contactName: string;
  inlineCustomerName: string;
  phone: string;
  mobile: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
  emailAddress: string;
  valid_until: string;
  note: string;
}

export interface QuotationItem {
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

export function useCreateQuotation() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [selectedMobile, setSelectedMobile] = useState<string>("");
  const [selectedPostCode, setSelectedPostCode] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(undefined);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [itemSearch, setItemSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [createInlineCustomer, setCreateInlineCustomer] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
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

  const quotationNumberRef = useRef(`QT-${String(Date.now()).slice(-6)}`);

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + calculateSubTotal(item),
    0,
  );

  // Function to get ALL warehouses for an item
  const getWarehousesForItem = async (itemId: number) => {
    try {
      const warehousesRepo = new WarehousesRepository();
      const allWarehouses = await warehousesRepo.getWithoutFilters();

      if (!allWarehouses?.warehousesData) {
        return [];
      }

      const { data: stockData, error } = await supabase
        .from("stocks")
        .select(`
          id,
          quantity,
          reserved,
          warehouse
        `)
        .eq("item", itemId);

      if (error) {
        console.error("Error fetching stock for item:", error);
        return allWarehouses.warehousesData.map((warehouse) => ({
          id: warehouse.id,
          name: warehouse.name,
          quantity: 0,
          reserved: 0,
          available: 0,
        }));
      }

      const stockByWarehouse = new Map();
      if (stockData) {
        stockData.forEach((stock) => {
          stockByWarehouse.set(stock.warehouse, {
            quantity: parseFloat(stock.quantity) || 0,
            reserved: parseFloat(stock.reserved) || 0,
            available: (parseFloat(stock.quantity) || 0) - (parseFloat(stock.reserved) || 0),
          });
        });
      }

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
          // Select the first address if no primary is set
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

  function changeAddress(newValue: any, actionMeta: any) {
    if (selectedCustomer && selectedAddressIndex !== -1 && customerAddresses.length > 0) {
      // Update selected address details
      const addressComponents = parseAddress(newValue?.value?.description ?? "");
      const newAddressDetails = {
        address: newValue?.value?.description ?? "",
        suburb: addressComponents.suburb,
        state: addressComponents.state,
        post_code: "",
      };
      
      setSelectedAddressDetails(newAddressDetails);
      
      // Update the specific address in the addresses array
      const updatedAddresses = [...customerAddresses];
      updatedAddresses[selectedAddressIndex] = {
        ...updatedAddresses[selectedAddressIndex],
        ...newAddressDetails,
      };
      setCustomerAddresses(updatedAddresses);
    } else {
      // For inline customers, use the existing behavior
      const addressComponents = parseAddress(newValue?.value?.description ?? "");
      setSelectedSuburb(addressComponents.suburb);
      setSelectedState(addressComponents.state);
      setSelectedAddress(newValue?.value?.description ?? "");
      setSelectedAddressDetails({
        address: newValue?.value?.description ?? "",
        suburb: addressComponents.suburb,
        state: addressComponents.state,
        post_code: "",
      });
    }
  }

  const setCreateInlineCustomerWithReset = (value: boolean) => {
    setCreateInlineCustomer(value);
    if (!value) {
      setInlineCustomerName("");
      // Reset address details when switching back to existing customer mode
      if (selectedCustomer && customerAddresses.length > 0) {
        const primaryIndex = customerAddresses.findIndex(addr => addr.is_primary);
        if (primaryIndex !== -1) {
          setSelectedAddressIndex(primaryIndex);
          setSelectedAddressDetails({
            address: customerAddresses[primaryIndex].address,
            suburb: customerAddresses[primaryIndex].suburb,
            state: customerAddresses[primaryIndex].state,
            post_code: customerAddresses[primaryIndex].post_code,
          });
        }
      }
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
    setSelectedAddressDetails({
      address: '',
      suburb: '',
      state: '',
      post_code: '',
    });
    setCustomerAddresses([]);
    setSelectedAddressIndex(-1);
  }

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

  const addItem = async (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const existingIndex = selectedItems.findIndex((i) => i.item_id === itemId);

    if (existingIndex !== -1) {
      const updatedItems = [...selectedItems];
      const newQuantity = parseFloat(updatedItems[existingIndex].quantity) + 1;

      updatedItems[existingIndex].quantity = newQuantity.toString();
      updatedItems[existingIndex].total = (
        newQuantity * Number(updatedItems[existingIndex].unit_price)
      ).toString();
      setSelectedItems(updatedItems);
    } else {
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

      const sortedWarehouses = [...allWarehouses].sort(
        (a, b) => b.available - a.available,
      );

      const selectedWarehouse = sortedWarehouses[0].id;

      const newItem: QuotationItem = {
        item_id: item.id,
        name: item.name,
        itemCode: item.itemCode,
        quantity: "1",
        unit_price: item?.sellPrice || 0,
        gst: item?.gst || false,
        total: item?.sellPrice.toString() || "0",
        warehouse_id: selectedWarehouse,
        available_warehouses: sortedWarehouses,
      };

      setSelectedItems([...selectedItems, newItem]);
    }

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

    const quantity = parseFloat(updatedItems[index].quantity);
    const unit_price = Number(updatedItems[index].unit_price);
    const baseTotal = quantity * unit_price;
    const gstAmount = updatedItems[index].gst ? baseTotal * 0.1 : 0;

    updatedItems[index].total = (baseTotal + gstAmount).toString();
    setSelectedItems(updatedItems);
  };

  function validate(values: ValuesCreateQuotation) {
    const errors: Partial<ValuesCreateQuotation> = {};

    if (!values.quotation_number) {
      errors.quotation_number = "required";
    }

    if (!createInlineCustomer) {
      if (!values.contactName || !values.contactName.trim()) {
        errors.contactName = "required";
      }
    } else {
      if (!values.inlineCustomerName || !values.inlineCustomerName.trim()) {
        errors.inlineCustomerName = "required";
      }
    }

    // Validate warehouse selection for all items
    const missingWarehouse = selectedItems.some((item) => !item.warehouse_id);
    if (missingWarehouse) {
      openSnackbar({
        open: true,
        message: "Please select a warehouse for all items",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateQuotation) {
    try {
      if (selectedItems.length === 0) {
        openSnackbar({
          open: true,
          message: "Please add at least one item to the quotation",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      // Check for missing warehouse selection
      const missingWarehouse = selectedItems.some((item) => !item.warehouse_id);
      if (missingWarehouse) {
        openSnackbar({
          open: true,
          message: "Please select a warehouse for all items",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      let customerToAdd;

      // Customer creation logic
      if (createInlineCustomer) {
        const newCustomer: CustomerSupabase = {
          name: values.inlineCustomerName,
          phone: values.phone,
          mobile: values.mobile,
          email: values.emailAddress,
          notes: values.note,
          addresses: [{
            address: values.address,
            suburb: values.suburb,
            state: values.state,
            post_code: values.postCode,
            is_primary: true
          }]
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
      } else {
        if (selectedCustomer) {
          customerToAdd = selectedCustomer;
        } else {
          const customerNameToUse = values.contactName;
          const customersRepository = new CustomersRepository();
          const existingCustomers =
            await customersRepository.getByName(customerNameToUse);
          let existingCustomer = null;

          if (existingCustomers?.customersData) {
            existingCustomer = existingCustomers.customersData.find(
              (c: any) => c.name === customerNameToUse,
            );
          }

          if (existingCustomer) {
            customerToAdd = existingCustomer.id;
          } else {
            const newCustomer: CustomerSupabase = {
              name: customerNameToUse,
              phone: values.phone,
              mobile: values.mobile,
              email: values.emailAddress,
              notes: values.note,
              addresses: [{
                address: values.address,
                suburb: values.suburb,
                state: values.state,
                post_code: values.postCode,
                is_primary: true
              }]
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

      // Use selected address details for the quotation snapshot
      const quotationAddress = selectedCustomer && customerAddresses.length > 0 && selectedAddressIndex !== -1
        ? selectedAddressDetails
        : {
            address: values.address,
            suburb: values.suburb,
            state: values.state,
            post_code: values.postCode,
          };

      const newQuotation: QuotationSupabase = {
        quotation_number: values.quotation_number,
        customer_id: customerToAdd,
        total: totalAmount,
        valid_until: values.valid_until ? new Date(values.valid_until) : null,
        note: values.note,
        status: "draft",
        // Save address snapshot to quotation
        address: quotationAddress.address,
        suburb: quotationAddress.suburb,
        state: quotationAddress.state,
        post_code: quotationAddress.post_code,
      };

      const quotationsRepo = new QuotationsRepository();

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
        const warningMessage = `Quotation will reserve stock from items with insufficient stock: ${lowStockItems
          .map(
            (item) =>
              `${item.name} (${item.quantity} > ${item.available_warehouses.find((w) => w.id === item.warehouse_id)?.available || 0} available)`,
          )
          .join(", ")}`;

        console.warn("Low stock warning:", warningMessage);
      }

      // Prepare items with warehouse IDs for reservation
      const itemsForReservation = selectedItems.map((item) => ({
        item_id: item.item_id,
        quantity: parseFloat(item.quantity),
        warehouse_id: item.warehouse_id || 1,
      }));

      const result = await quotationsRepo.createWithStockReservation(
        newQuotation,
        itemsForReservation,
      );

      if (!result.success) {
        openSnackbar({
          open: true,
          message: `Quotation could not be created: ${result.error}`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      const quotationId = result.quotation?.id;
      if (!quotationId) {
        openSnackbar({
          open: true,
          message: "Failed to get quotation ID",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      // Add quotation items with warehouse_id
      for (const item of selectedItems) {
        const itemQuantity = parseFloat(item.quantity);
        const itemUnitPrice = Number(item.unit_price);
        const warehouseId = item.warehouse_id || 1;

        await quotationsRepo.addItem({
          quotation_id: quotationId,
          item_id: item.item_id,
          quantity: itemQuantity,
          unit_price: itemUnitPrice,
          warehouse_id: warehouseId,
        });
      }

      // Show success message with warning if low stock
      if (lowStockItems.length > 0) {
        openSnackbar({
          open: true,
          message: `Quotation created successfully! ⚠️ ${lowStockItems.length} item(s) have insufficient stock but were still reserved.`,
          variant: "alert",
          alert: { color: "warning" },
        } as SnackbarProps);
      } else {
        openSnackbar({
          open: true,
          message: "Quotation created successfully with stock reservation.",
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
      }

      navigate("/quotations");
    } catch (e: any) {
      console.error("Error creating quotation:", e);
      openSnackbar({
        open: true,
        message: `Quotation could not be created: ${e.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
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
    setLoadingItems(true);
    const itemsRepository = new ItemsRepository();
    const allItems = await itemsRepository.getByName(itemSearch || "");
    if (allItems?.itemsData) {
      setItems(allItems.itemsData);
    }
    setLoadingItems(false);
  }

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([getCustomers(), getItems()]);
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
        
        // Fetch addresses for the selected customer
        fetchCustomerAddresses(selectedCustomer);
      }
    } else if (!createInlineCustomer) {
      resetCustomerData();
    }
  }, [selectedCustomer, customers, createInlineCustomer, fetchCustomerAddresses]);

  // Update Formik values when address details change
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
    handleItemSearchDebounced,
    loadingItems,
    selectedItemId,
    setSelectedItemId,
    setCreateInlineCustomer: setCreateInlineCustomerWithReset,
    inlineCustomerName,
    quotationNumberRef,
    setInlineCustomerName,
    customerName,
    setCustomerName,
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    selectedAddressDetails,
    handleAddressSelect,
    setSelectedAddressDetails,
  };
}