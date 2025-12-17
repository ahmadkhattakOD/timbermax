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
    
    for (const item of items) {
      const result = await stocksRepo.getAvailableStock(item.id, 1);
      if (result.success) {
        stockMap[item.id] = result.totalAvailable || 0;
      } else {
        console.warn(`Failed to get stock for item ${item.id}:`, result.error);
        stockMap[item.id] = 0;
      }
    }
    
    setAvailableStock(stockMap);
  }

  const addItem = (item: any) => {
    // Check if item already exists in selected items
    const existingIndex = selectedItems.findIndex(i => i.item_id === item.item_id);
    
    if (existingIndex !== -1) {
      // Update existing item quantity
      const updatedItems = [...selectedItems];
      const newQuantity = parseFloat(updatedItems[existingIndex].quantity) + 1;
      const available = availableStock[item.item_id] || 0;
      
      // Check if total requested exceeds available
      const totalRequested = selectedItems
        .filter(i => i.item_id === item.item_id)
        .reduce((sum, i) => sum + parseFloat(i.quantity), 0) + 1;
      
      if (totalRequested > available) {
        openSnackbar({
          open: true,
          message: `Cannot add more of "${item.name}". Only ${available} available.`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }
      
      updatedItems[existingIndex].quantity = newQuantity.toString();
      updatedItems[existingIndex].total = (newQuantity * parseFloat(updatedItems[existingIndex].unit_price)).toString();
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      const available = availableStock[item.item_id] || 0;
      if (available <= 0) {
        openSnackbar({
          open: true,
          message: `Item "${item.name}" is out of stock!`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
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

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...selectedItems];
    const item = updatedItems[index];
    
    if (field === 'quantity') {
      const newQuantity = parseFloat(value);
      const available = availableStock[item.item_id] || 0;
      const totalRequested = selectedItems
        .filter((i, idx) => idx !== index && i.item_id === item.item_id)
        .reduce((sum, i) => sum + parseFloat(i.quantity), 0) + newQuantity;
      
      if (newQuantity < 1) {
        openSnackbar({
          open: true,
          message: "Quantity must be at least 1",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }
      
      if (totalRequested > available) {
        openSnackbar({
          open: true,
          message: `Cannot select ${value} items. Only ${available} available. ${totalRequested - newQuantity} already selected.`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
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
    }

    // Validate stock availability
    for (const item of selectedItems) {
      const available = availableStock[item.item_id] || 0;
      const totalRequested = selectedItems
        .filter(i => i.item_id === item.item_id)
        .reduce((sum, i) => sum + parseFloat(i.quantity), 0);
      
      if (totalRequested > available) {
        // Optional: Add error handling
      }
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateQuotation) {
    try {
      // Final stock validation before submission
      for (const item of selectedItems) {
        const available = availableStock[item.item_id] || 0;
        const totalRequested = selectedItems
          .filter(i => i.item_id === item.item_id)
          .reduce((sum, i) => sum + parseFloat(i.quantity), 0);
        
        if (totalRequested > available) {
          openSnackbar({
            open: true,
            message: `Insufficient stock for "${item.name}". Available: ${available}, Requested: ${totalRequested}`,
            variant: "alert",
            alert: { color: "error" },
          } as SnackbarProps);
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
        status: 'draft'
      };

      const quotationsRepo = new QuotationsRepository();
      const createdQuotation = await quotationsRepo.create(newQuotation);

      if (!createdQuotation) {
        openSnackbar({
          open: true,
          message: "Quotation could not be created. Please try again.",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      const stocksRepo = new StocksRepository();
      const quotationId = createdQuotation.id;
      let hasError = false;
      let errorMessage = "";

      // Add items and reserve stock
      for (const item of selectedItems) {
        const itemQuantity = parseFloat(item.quantity);
        const itemUnitPrice = parseFloat(item.unit_price);
        
        // Add item to quotation
        const addedItem = await quotationsRepo.addItem({
          quotation_id: quotationId,
          item_id: item.item_id,
          quantity: itemQuantity,
          unit_price: itemUnitPrice
        });

        if (!addedItem) {
          hasError = true;
          errorMessage = `Failed to add item "${item.name}" to quotation`;
          break;
        }

        // Reserve stock for quotation
        const reserveResult = await stocksRepo.reserveForQuotation(
          item.item_id,
          1, // default warehouse
          itemQuantity,
          quotationId
        );

        if (!reserveResult.success) {
          hasError = true;
          errorMessage = `Failed to reserve stock for "${item.name}". ${reserveResult.error}`;
          break;
        }
      }

      if (hasError) {
        // Rollback: delete the quotation if any step fails
        await quotationsRepo.delete([quotationId]);
        openSnackbar({
          open: true,
          message: errorMessage,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
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