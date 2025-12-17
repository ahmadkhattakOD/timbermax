import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  parseAddress,
  useDebouncedSearch,
  getDateFormattedForField,
} from "utils/helpers";
import CustomersRepository, {
  CustomerSupabase,
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import QuotationsRepository, {
  QuotationSupabase,
} from "utils/repositories/quotationRepo";
import StocksRepository from "utils/repositories/stocksRepository";

export interface ValuesEditQuotation {
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
  status: "draft" | "sent" | "accepted" | "converted" | "cancelled";
}

export function useEditQuotation(quotationId: number) {
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
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>(undefined);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [createInlineCustomer, setCreateInlineCustomer] = useState(false);
  const [availableStock, setAvailableStock] = useState<Record<number, number>>({});
  const [quotationData, setQuotationData] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<"draft" | "sent" | "accepted" | "converted" | "cancelled">("draft");
  
  const [initialValues, setInitialValues] = useState<ValuesEditQuotation>({
    quotation_number: "",
    contactName: "",
    inlineCustomerName: "",
    phone: "",
    mobile: "",
    address: "",
    suburb: "",
    state: "",
    postCode: "",
    emailAddress: "",
    valid_until: "",
    note: "",
    status: "draft",
  });

  const totalAmount = selectedItems.reduce((sum, item) => 
    sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0
  );

  function changeAddress(newValue: any) {
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
        // Add current quotation's items back to available stock for accurate calculation
        const currentQuotationItem = selectedItems.find(i => i.item_id === item.id);
        if (currentQuotationItem) {
          stockMap[item.id] = (result.totalAvailable || 0) + parseFloat(currentQuotationItem.quantity);
        } else {
          stockMap[item.id] = result.totalAvailable || 0;
        }
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

  const removeItem = async (index: number) => {
    const itemToRemove = selectedItems[index];
    
    try {
      // Release stock for this item
      const stocksRepo = new StocksRepository();
      const result = await stocksRepo.releaseFromQuotation(
        quotationId,
        itemToRemove.item_id,
        1, // Default warehouse ID
        parseFloat(itemToRemove.quantity)
      );
      
      if (!result.success) {
        openSnackbar({
          open: true,
          message: `Failed to release stock: ${result.error}`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }
      
      // Remove from selected items
      setSelectedItems(selectedItems.filter((_, i) => i !== index));
      
      // Update quotation total
      const quotationsRepo = new QuotationsRepository();
      await quotationsRepo.updateQuotationTotal(quotationId);
      
      openSnackbar({
        open: true,
        message: `Item removed and stock released successfully`,
        variant: "alert",
        alert: { color: "success" },
      } as SnackbarProps);
      
    } catch (error: any) {
      console.error("Error removing item:", error);
      openSnackbar({
        open: true,
        message: `Failed to remove item: ${error.message}`,
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }
  };

  const updateItem = async (index: number, field: string, value: any) => {
    const updatedItems = [...selectedItems];
    const item = updatedItems[index];
    const oldQuantity = parseFloat(item.quantity);
    
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
          message: `Cannot select ${newQuantity} items. Only ${available} available. ${totalRequested - newQuantity} already selected.`,
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }
      
      // Adjust stock reservation
      const quantityDiff = newQuantity - oldQuantity;
      if (quantityDiff !== 0) {
        try {
          const stocksRepo = new StocksRepository();
          const result = await stocksRepo.adjustStockReservation(
            quotationId,
            item.item_id,
            1, // Default warehouse ID
            oldQuantity,
            newQuantity
          );
          
          if (!result.success) {
            openSnackbar({
              open: true,
              message: `Failed to adjust stock: ${result.error}`,
              variant: "alert",
              alert: { color: "error" },
            } as SnackbarProps);
            return;
          }
        } catch (error: any) {
          console.error("Error adjusting stock reservation:", error);
          openSnackbar({
            open: true,
            message: `Failed to adjust stock reservation: ${error.message}`,
            variant: "alert",
            alert: { color: "error" },
          } as SnackbarProps);
          return;
        }
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

  function validate(values: ValuesEditQuotation) {
    const errors: Partial<ValuesEditQuotation> = {};

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
      // Optional: Add error for items
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

    if (!values.status) {
      errors.status = "required" as any;
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditQuotation) {
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

      const updatedQuotation: Partial<QuotationSupabase> = {
        customer_id: customerToAdd,
        total: totalAmount,
        valid_until: values.valid_until ? new Date(values.valid_until) : null,
        note: values.note,
        status: values.status
      };

      const quotationsRepo = new QuotationsRepository();
      const stocksRepo = new StocksRepository();
      
      // Update quotation details
      const updated = await quotationsRepo.edit(quotationId, updatedQuotation);

      if (!updated) {
        openSnackbar({
          open: true,
          message: "Quotation could not be updated. Please try again.",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      // Get current items from database
      const currentItemsResult = await quotationsRepo.getItems(quotationId);
      const currentItems = currentItemsResult?.data || [];
      
      // Identify items to remove
      const currentItemIds = currentItems.map((item: any) => item.item_id);
      const newItemIds = selectedItems.map(item => item.item_id);
      
      // Remove items that are no longer in the quotation
      for (const item of currentItems) {
        if (!newItemIds.includes(item.item_id)) {
          // Delete item from quotation
          await quotationsRepo.deleteItem(quotationId, item.item_id);
          
          // Release stock for removed items
          const releaseResult = await stocksRepo.releaseFromQuotation(
            quotationId,
            item.item_id,
            1, // Default warehouse ID
            parseFloat(item.quantity)
          );
          
          if (!releaseResult.success) {
            console.warn(`Failed to release stock for item ${item.item_id}:`, releaseResult.error);
          }
        }
      }
      
      // Update or add items
      for (const selectedItem of selectedItems) {
        const itemQuantity = parseFloat(selectedItem.quantity);
        const itemUnitPrice = parseFloat(selectedItem.unit_price);
        
        if (currentItemIds.includes(selectedItem.item_id)) {
          // Get current item to compare quantities
          const currentItem = currentItems.find((item: any) => item.item_id === selectedItem.item_id);
          const currentQuantity = currentItem ? parseFloat(currentItem.quantity) : 0;
          
          // Update existing item
          await quotationsRepo.updateItem(quotationId, selectedItem.item_id, {
            quantity: itemQuantity,
            unit_price: itemUnitPrice
          });
          
          // Adjust stock if quantity changed
          if (itemQuantity !== currentQuantity) {
            const adjustResult = await stocksRepo.adjustStockReservation(
              quotationId,
              selectedItem.item_id,
              1,
              currentQuantity,
              itemQuantity
            );
            
            if (!adjustResult.success) {
              console.warn(`Failed to adjust stock for item ${selectedItem.item_id}:`, adjustResult.error);
            }
          }
        } else {
          // Add new item
          await quotationsRepo.addItem({
            quotation_id: quotationId,
            item_id: selectedItem.item_id,
            quantity: itemQuantity,
            unit_price: itemUnitPrice
          });
          
          // Reserve stock for new item
          const reserveResult = await stocksRepo.reserveForQuotation(
            selectedItem.item_id,
            1,
            itemQuantity,
            quotationId
          );
          
          if (!reserveResult.success) {
            console.warn(`Failed to reserve stock for new item ${selectedItem.item_id}:`, reserveResult.error);
          }
        }
      }

      // Update quotation total
      await quotationsRepo.updateQuotationTotal(quotationId);

      openSnackbar({
        open: true,
        message: "Quotation updated successfully.",
        variant: "alert",
        alert: { color: "success" },
      } as SnackbarProps);

      navigate("/quotations");

    } catch (e: any) {
      console.error("Error updating quotation:", e);
      openSnackbar({
        open: true,
        message: `Quotation could not be updated: ${e.message}`,
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

  async function loadQuotationData() {
    if (!quotationId) return;
    
    setLoading(true);
    try {
      const quotationsRepo = new QuotationsRepository();
      const result = await quotationsRepo.getSingle(quotationId);
      
      if (result?.quotationData) {
        const quotation = result.quotationData;
        setQuotationData(quotation);
        setCurrentStatus(quotation.status);
        
        // Set initial form values
        setInitialValues({
          quotation_number: quotation.quotation_number || "",
          contactName: quotation.customers?.name || "",
          inlineCustomerName: quotation.customers?.name || "",
          phone: quotation.customers?.phone || "",
          mobile: quotation.customers?.mobile || "",
          address: quotation.customers?.address || "",
          suburb: quotation.customers?.suburb || "",
          state: quotation.customers?.state || "",
          postCode: quotation.customers?.post_code || "",
          emailAddress: quotation.customers?.email || "",
          valid_until: quotation.valid_until ? getDateFormattedForField(new Date(quotation.valid_until)) : "",
          note: quotation.note || "",
          status: quotation.status || "draft",
        });
        
        // Set customer
        setSelectedCustomer(quotation.customer_id);
        
        // Set customer details
        setSelectedPhone(quotation.customers?.phone || "");
        setSelectedMobile(quotation.customers?.mobile || "");
        setSelectedEmail(quotation.customers?.email || "");
        setSelectedAddress(quotation.customers?.address || "");
        setSelectedSuburb(quotation.customers?.suburb || "");
        setSelectedState(quotation.customers?.state || "");
        setSelectedPostCode(quotation.customers?.post_code || "");
        
        // Set items
        if (quotation.quotation_items) {
          const itemsWithDetails = quotation.quotation_items.map((item: any) => ({
            item_id: item.item_id,
            name: item.items?.name || "",
            itemCode: item.items?.itemCode || "",
            quantity: item.quantity.toString(),
            unit_price: item.unit_price.toString(),
            total: (parseFloat(item.quantity) * parseFloat(item.unit_price)).toString(),
            available_stock: 0, // Will be updated after loading items
          }));
          setSelectedItems(itemsWithDetails);
        }
      }
      
      // Load customers and items
      await Promise.all([getCustomers(), getItems()]);
      await checkStockAvailability();
    } catch (error) {
      console.error("Error loading quotation data:", error);
    }
    setLoading(false);
  }

  async function loadData() {
    await loadQuotationData();
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
  }, [items, selectedItems]);

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
    initialValues,
    currentStatus,
    quotationData,
  };
}