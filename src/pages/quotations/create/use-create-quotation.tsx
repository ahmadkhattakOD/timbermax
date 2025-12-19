import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  parseAddress,
  useDebouncedSearch,
} from "utils/helpers";
import CustomersRepository, {
  CustomerSupabase,
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import QuotationsRepository, {
  QuotationSupabase,
} from "utils/repositories/quotationRepo";
import StocksRepository from "utils/repositories/stocksRepository";

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

export function useCreateQuotation() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
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
  const [availableStock, setAvailableStock] = useState<Record<number, number>>({});
  const [stockReservations, setStockReservations] = useState<Record<number, number>>({});

  const totalAmount = selectedItems.reduce((sum, item) => 
    sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0
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

  // Check stock availability for all items
  async function checkStockAvailability() {
    const stocksRepo = new StocksRepository();
    const stockMap: Record<number, number> = {};
    const reservationMap: Record<number, number> = {};
    
    for (const item of items) {
      // Get total available stock
      const result = await stocksRepo.getAvailableStock(item.id, 1);
      if (result.success) {
        stockMap[item.id] = result.totalAvailable || 0;
      } else {
        console.warn(`Failed to get stock for item ${item.id}:`, result.error);
        stockMap[item.id] = 0;
      }
      
      // Get already reserved quantity for this item (from other quotations)
      const reservedResult = await stocksRepo.getTotalReservedForItem(item.id, 1);
      if (reservedResult.success) {
        reservationMap[item.id] = reservedResult.totalReserved || 0;
      }
    }
    
    setAvailableStock(stockMap);
    setStockReservations(reservationMap);
  }

  const addItem = (item: any) => {
    // Check if item already exists in selected items
    const existingIndex = selectedItems.findIndex(i => i.item_id === item.item_id);
    
    if (existingIndex !== -1) {
      // Update existing item quantity
      const updatedItems = [...selectedItems];
      const newQuantity = parseFloat(updatedItems[existingIndex].quantity) + 1;
      
      // Check stock availability
      if (!checkItemAvailability(item.item_id, newQuantity)) {
        return;
      }
      
      updatedItems[existingIndex].quantity = newQuantity.toString();
      updatedItems[existingIndex].total = (newQuantity * parseFloat(updatedItems[existingIndex].unit_price)).toString();
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      if (!checkItemAvailability(item.item_id, 1)) {
        return;
      }
      
      const newItem = {
        ...item,
        quantity: "1",
        total: item.unit_price.toString()
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  // Helper function to check item availability
  const checkItemAvailability = (itemId: number, requestedQuantity: number) => {
    const available = availableStock[itemId] || 0;
    const alreadyReserved = stockReservations[itemId] || 0;
    
    // Calculate total requested from current selection
    const currentRequested = selectedItems
      .filter(i => i.item_id === itemId)
      .reduce((sum, i) => sum + parseFloat(i.quantity), 0);
    
    const totalNeeded = currentRequested + requestedQuantity;
    
    // Check if we have enough stock considering both available and already reserved
    if (totalNeeded > available) {
      const netAvailable = Math.max(0, available - alreadyReserved);
      if (netAvailable < requestedQuantity) {
        openSnackbar({
          open: true,
          message: `Insufficient stock. Only ${netAvailable} available (${available} total - ${alreadyReserved} already reserved).`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return false;
      }
    }
    
    return true;
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...selectedItems];
    const item = updatedItems[index];
    
    if (field === 'quantity') {
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
      
      // Check availability
      if (!checkItemAvailability(item.item_id, newQuantity)) {
        return;
      }
      
      updatedItems[index].quantity = value;
    } 
    else if (field === 'unit_price') {
      updatedItems[index].unit_price = value;
    }
    
    // Recalculate total for the item
    const quantity = parseFloat(updatedItems[index].quantity);
    const unit_price = parseFloat(updatedItems[index].unit_price);
    updatedItems[index].total = (quantity * unit_price).toString();
    setSelectedItems(updatedItems);
  };

  function validate(values: ValuesCreateQuotation) {
    const errors: Partial<ValuesCreateQuotation> = {};

    if (!values.quotation_number) {
      errors.quotation_number = "required";
    }

    if (!createInlineCustomer && !selectedCustomer) {
      errors.contactName = "required";
    }

    if (createInlineCustomer && !values.inlineCustomerName.trim()) {
      errors.inlineCustomerName = "required";
    }

    if (selectedItems.length === 0) {
      // You can add error for items if needed
      openSnackbar({
        open: true,
        message: "Please add at least one item to the quotation",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
      return errors;
    }

    // Validate stock availability
    for (const item of selectedItems) {
      const itemId = item.item_id;
      const requestedQuantity = parseFloat(item.quantity);
      
      if (!checkItemAvailability(itemId, requestedQuantity)) {
        // Error will be shown by checkItemAvailability
        return errors;
      }
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateQuotation) {
    try {
      // Final stock validation before submission
      for (const item of selectedItems) {
        const itemId = item.item_id;
        const requestedQuantity = parseFloat(item.quantity);
        
        if (!checkItemAvailability(itemId, requestedQuantity)) {
          return;
        }
      }

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

      const newQuotation: QuotationSupabase = {
        quotation_number: values.quotation_number,
        customer_id: customerToAdd,
        total: totalAmount,
        valid_until: values.valid_until ? new Date(values.valid_until) : null,
        note: values.note,
        status: 'draft' // Always start as draft
      };

      // Use the new method that handles stock reservation
      const quotationsRepo = new QuotationsRepository();
      
      // Prepare items for reservation
      const itemsForReservation = selectedItems.map(item => ({
        item_id: item.item_id,
        quantity: parseFloat(item.quantity)
      }));

      // Create quotation with stock reservation
      const result = await quotationsRepo.createWithStockReservation(
        newQuotation,
        itemsForReservation
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

      // Add items to quotation_items table
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

      // Add each item to quotation_items
      for (const item of selectedItems) {
        const itemQuantity = parseFloat(item.quantity);
        const itemUnitPrice = parseFloat(item.unit_price);
        
        await quotationsRepo.addItem({
          quotation_id: quotationId,
          item_id: item.item_id,
          quantity: itemQuantity,
          unit_price: itemUnitPrice
        });
      }

      openSnackbar({
        open: true,
        message: "Quotation created successfully. Stock has been reserved.",
        variant: "alert",
        alert: { color: "success" },
      } as SnackbarProps);

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
    const itemsRepository = new ItemsRepository();
    const allItems = await itemsRepository.getWithoutFilters();
    if (allItems?.itemsData) {
      setItems(allItems.itemsData);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([getCustomers(), getItems()]);
      await checkStockAvailability();
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

  // Update stock availability when items change
  useEffect(() => {
    if (items.length > 0) {
      checkStockAvailability();
    }
  }, [items]);

  // Re-check availability when selected items change
  useEffect(() => {
    checkStockAvailability();
  }, [selectedItems]);

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
    availableStock,
    checkStockAvailability,
  };
}