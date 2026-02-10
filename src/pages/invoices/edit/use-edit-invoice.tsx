import { openSnackbar } from "api/snackbar";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  parseAddress,
  useDebouncedSearch,
  getDateFormattedForField,
  calculateItemTotal,
  calculateSubTotal,
} from "utils/helpers";
import CustomersRepository, {
  CustomerSupabase,
  CustomerAddress,
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import InvoicesRepository, {
  InvoiceSupabase,
} from "utils/repositories/invoicesRepository";
import StocksRepository from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";
import supabase from "utils/supabase";

export interface ValuesEditInvoice {
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
  status: "draft" | "sent" | "paid" | "cancelled" | "converted";
  delivery_status: "pending" | "packed" | "shipped" | "delivered" | "returned";
  payment_method: string;
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

export function useEditInvoice(invoiceId: number) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [selectedMobile, setSelectedMobile] = useState<string>("");
  const [selectedPostCode, setSelectedPostCode] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>(undefined);
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [itemSearch, setItemSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<any>("draft");
  const [createInlineCustomer, setCreateInlineCustomer] = useState(false);
  const [inlineCustomerName, setInlineCustomerName] = useState("");
  const [customerName, setCustomerName] = useState<string>("");

  // New states for customer addresses
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddressWithSelection[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(-1);

  // Payment method states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>("");

  const [initialValues, setInitialValues] = useState<ValuesEditInvoice>({
    invoice_number: "",
    contactName: "",
    inlineCustomerName: "",
    phone: "",
    mobile: "",
    address: "",
    suburb: "",
    state: "",
    postCode: "",
    emailAddress: "",
    invoice_date: "",
    note: "",
    status: "draft",
    delivery_status: "pending",
    payment_method: "",
  });

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
            available:
              (parseFloat(stock.quantity) || 0) -
              (parseFloat(stock.reserved) || 0),
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

  // Function to fetch customer addresses - MATCHING THE INVOICE'S SAVED ADDRESS
  const fetchCustomerAddresses = useCallback(async (customerId: number, invoiceAddress?: { address: string; suburb: string; state: string; post_code: string }) => {
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

        // IMPORTANT: Match against the invoice's saved address, not the customer's current address
        const addrToMatch = invoiceAddress || {
          address: customer.address || '',
          suburb: customer.suburb || '',
          state: customer.state || '',
          post_code: customer.post_code || '',
        };

        const matchingIndex = addresses.findIndex(addr =>
          addr.address === addrToMatch.address &&
          addr.suburb === addrToMatch.suburb &&
          addr.state === addrToMatch.state &&
          addr.post_code === addrToMatch.post_code
        );

        if (matchingIndex !== -1) {
          setSelectedAddressIndex(matchingIndex);
        } else if (addresses.length > 0) {
          // If no exact match, select the primary or first address
          const primaryIndex = addresses.findIndex(addr => addr.is_primary);
          const indexToSelect = primaryIndex !== -1 ? primaryIndex : 0;
          setSelectedAddressIndex(indexToSelect);
        } else {
          setSelectedAddressIndex(-1);
        }
      }
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
      setCustomerAddresses([]);
      setSelectedAddressIndex(-1);
    }
  }, []);

  // Handle address selection
  const handleAddressSelect = (index: number) => {
    if (index >= 0 && index < customerAddresses.length) {
      setSelectedAddressIndex(index);
      const selectedAddr = customerAddresses[index];
      
      setSelectedAddress(selectedAddr.address);
      setSelectedSuburb(selectedAddr.suburb);
      setSelectedState(selectedAddr.state);
      setSelectedPostCode(selectedAddr.post_code);
      
      // Update initial values
      setInitialValues(prev => ({
        ...prev,
        address: selectedAddr.address,
        suburb: selectedAddr.suburb,
        state: selectedAddr.state,
        postCode: selectedAddr.post_code,
      }));
    }
  };

  function changeAddress(newValue: any, actionMeta: any) {
    const addressComponents = parseAddress(newValue?.value?.description ?? "");
    setSelectedAddress(newValue?.value?.description ?? "");
    setSelectedSuburb(addressComponents.suburb);
    setSelectedState(addressComponents.state);
    setSelectedPostCode("");

    // Update initial values
    setInitialValues(prev => ({
      ...prev,
      address: newValue?.value?.description ?? "",
      suburb: addressComponents.suburb,
      state: addressComponents.state,
      postCode: "",
    }));
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomerSearch(e.target.value);
  }

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

  function handleItemSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setItemSearch(e.target.value);
  }

  const handleItemSearchDebounced = useDebouncedSearch(handleItemSearchChange);

  const setCreateInlineCustomerWithReset = (value: boolean) => {
    setCreateInlineCustomer(value);
    if (!value) {
      setInlineCustomerName("");
    }
  };

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
      // Get ALL warehouses for this item
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

      // Auto-select warehouse with highest available stock
      const selectedWarehouse = sortedWarehouses[0].id;

      // Add new item with warehouses
      const newItem: InvoiceItem = {
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

  function validate(values: ValuesEditInvoice) {
    const errors: Partial<ValuesEditInvoice> = {};

    if (!values.invoice_number) {
      errors.invoice_number = "required";
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

    if (!values.invoice_date) {
      errors.invoice_date = "required";
    }

    if (!values.status) {
      errors.status = "required" as any;
    }

    if (!values.delivery_status) {
      errors.delivery_status = "required" as any;
    }

    // Validate payment method is provided when status is "paid"
    if (values.status === "paid" && !values.payment_method) {
      errors.payment_method = "required" as any;
      openSnackbar({
        open: true,
        message: "Payment method is required when marking invoice as paid",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }

    if (selectedItems.length === 0) {
      openSnackbar({
        open: true,
        message: "Please add at least one item to the invoice",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
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

  async function onSubmit(values: ValuesEditInvoice) {
    try {
      if (selectedItems.length === 0) {
        openSnackbar({
          open: true,
          message: "Please add at least one item to the invoice",
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

      let customerToUpdate;

      // Handle inline customer creation
      if (createInlineCustomer) {
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
        const customersRepository = new CustomersRepository();
        const createdCustomer = await customersRepository.create(newCustomer);
        if (createdCustomer) {
          customerToUpdate = createdCustomer.id;
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
          customerToUpdate = selectedCustomer;
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
            customerToUpdate = existingCustomer.id;
            await customersRepository.edit(existingCustomer.id, {
              name: customerNameToUse,
              phone: values.phone,
              mobile: values.mobile,
              email: values.emailAddress,
              notes: values.note,
              address: values.address,
              suburb: values.suburb,
              state: values.state,
              post_code: values.postCode,
            });
          } else {
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
              customerToUpdate = createdCustomer.id;
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

      const invoicesRepo = new InvoicesRepository();
      const stocksRepo = new StocksRepository();

      // Get current invoice items from database (with warehouse info if available)
      const currentItemsResult = await invoicesRepo.getItems(invoiceId);
      const currentItems = currentItemsResult?.data || [];

      // Check status changes
      const statusChangedToCancelled =
        currentStatus !== "cancelled" && values.status === "cancelled";

      const statusChangedFromCancelled =
        currentStatus === "cancelled" && values.status !== "cancelled";

      // Handle stock adjustments based on status changes
      if (statusChangedToCancelled) {
        // If changing to cancelled, restore stock for each item in its respective warehouse
        for (const item of currentItems) {
          const warehouseId = item.warehouse_id || 1;
          await stocksRepo.restoreStockFromInvoice(
            item.item_id,
            warehouseId,
            item.quantity,
          );
        }
      } else if (statusChangedFromCancelled) {
        // If changing from cancelled back to active, reduce stock again
        for (const selectedItem of selectedItems) {
          const warehouseId = selectedItem.warehouse_id || 1;
          await stocksRepo.reduceStockForInvoice(
            selectedItem.item_id,
            warehouseId,
            parseFloat(selectedItem.quantity),
            invoiceId,
          );
        }
      }

      // Calculate total with GST
      const totalWithGST = selectedItems.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0,
      );

      // Update invoice details with address snapshot
      const updatedInvoice = {
        customer_id: customerToUpdate,
        total: totalWithGST,
        invoice_date: values.invoice_date
          ? new Date(values.invoice_date)
          : null,
        note: values.note,
        status: values.status,
        delivery_status: values.delivery_status,
        // Save address snapshot to invoice - THIS IS KEY
        address: values.address,
        suburb: values.suburb,
        state: values.state,
        post_code: values.postCode,
        // Save payment method and date when status is "paid"
        payment_method: values.status === "paid" ? values.payment_method : null,
        payment_date: values.status === "paid" ? new Date() : null,
      };

      const updated = await invoicesRepo.edit(invoiceId, updatedInvoice as any);

      if (!updated) {
        openSnackbar({
          open: true,
          message: "Invoice could not be updated. Please try again.",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

      // Only update items if status is not cancelled
      if (values.status !== "cancelled") {
        // Identify items to remove
        const currentItemIds = currentItems.map((item: any) => item.item_id);
        const newItemIds = selectedItems.map((item) => item.item_id);

        // Items to remove (in current but not in new)
        const itemsToRemove = currentItems.filter(
          (item: any) => !newItemIds.includes(item.item_id),
        );

        // Remove items that are no longer in the invoice
        for (const item of itemsToRemove) {
          // Delete item from invoice_items
          await invoicesRepo.deleteItem(invoiceId, item.item_id);

          // Restore stock for removed items in the correct warehouse
          const warehouseId = item.warehouse_id || 1;
          await stocksRepo.restoreStockFromInvoice(
            item.item_id,
            warehouseId,
            item.quantity,
          );
        }

        // Update or add items
        for (const selectedItem of selectedItems) {
          const itemId = selectedItem.item_id;
          const newQuantity = parseFloat(selectedItem.quantity);
          const itemUnitPrice = Number(selectedItem.unit_price);
          const warehouseId = selectedItem.warehouse_id || 1;

          const currentItem = currentItems.find(
            (item: any) => item.item_id === itemId,
          );

          if (currentItem) {
            const currentQuantity = parseFloat(currentItem.quantity);
            const currentWarehouseId = currentItem.warehouse_id || 1;

            // Update invoice item with warehouse
            await invoicesRepo.updateItem(invoiceId, itemId, {
              quantity: newQuantity,
              unit_price: itemUnitPrice,
              warehouse_id: warehouseId,
            });

            // Adjust stock if quantity changed OR warehouse changed
            if (
              newQuantity !== currentQuantity ||
              warehouseId !== currentWarehouseId
            ) {
              const quantityDiff = newQuantity - currentQuantity;

              if (warehouseId !== currentWarehouseId) {
                // Warehouse changed - two clear movements
                await stocksRepo.restoreStockFromInvoice(
                  itemId,
                  currentWarehouseId,
                  currentQuantity,
                );

                await stocksRepo.reduceStockForInvoice(
                  itemId,
                  warehouseId,
                  newQuantity,
                  invoiceId,
                  undefined,
                  `Invoice #${invoiceId} edited: Moved to Warehouse ${warehouseId}`,
                );
              } else {
                // Same warehouse, quantity change - single movement
                if (quantityDiff > 0) {
                  // Increased
                  await stocksRepo.reduceStockForInvoice(
                    itemId,
                    warehouseId,
                    quantityDiff,
                    invoiceId,
                    undefined,
                    `Invoice #${invoiceId} edited: Quantity increased by ${quantityDiff}`,
                  );
                } else if (quantityDiff < 0) {
                  // Decreased
                  await stocksRepo.restoreStockFromInvoice(
                    itemId,
                    warehouseId,
                    Math.abs(quantityDiff),
                    `Invoice #${invoiceId} edited: Quantity decreased by ${Math.abs(quantityDiff)}`,
                  );
                }
              }
            }
          } else {
            // Add new item with warehouse
            await invoicesRepo.addItem({
              invoice_id: invoiceId,
              item_id: itemId,
              quantity: newQuantity,
              unit_price: itemUnitPrice,
              warehouse_id: warehouseId,
            });

            // Reduce stock for new item in specified warehouse
            await stocksRepo.reduceStockForInvoice(
              itemId,
              warehouseId,
              newQuantity,
              invoiceId,
            );
          }
        }
      }

      openSnackbar({
        open: true,
        message: "Invoice updated successfully with stock tracking.",
        variant: "alert",
        alert: { color: "success" },
      } as SnackbarProps);

      navigate("/invoices");
    } catch (e: any) {
      console.error("Error updating invoice:", e);
      openSnackbar({
        open: true,
        message: `Invoice could not be updated: ${e.message}`,
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

  async function getAllWarehouses() {
    const warehousesRepo = new WarehousesRepository();
    const allWarehouses = await warehousesRepo.getWithoutFilters();
    if (allWarehouses?.warehousesData) {
      setWarehouses(allWarehouses.warehousesData);
    }
  }

  async function loadInvoiceData() {
    if (!invoiceId) return;

    setLoading(true);
    try {
      const invoicesRepo = new InvoicesRepository();
      const result: any = await invoicesRepo.getSingle(invoiceId);

      if (result?.invoiceData) {
        const invoice = result.invoiceData;
        setInvoiceData(invoice);
        setCurrentStatus(invoice.status);

        // Set customer data
        const customerId = invoice.customer_id;
        setSelectedCustomer(customerId);
        setCustomerId(customerId);
        setCustomerName(invoice.customers?.name || "");
        setSelectedPhone(invoice.customers?.phone || "");
        setSelectedMobile(invoice.customers?.mobile || "");
        setSelectedEmail(invoice.customers?.email || "");

        // Use address from invoice (snapshot) instead of customer's current address
        // This ensures we show the address that was saved with the invoice
        setSelectedAddress(invoice.address || "");
        setSelectedSuburb(invoice.suburb || "");
        setSelectedState(invoice.state || "");
        setSelectedPostCode(invoice.post_code || "");

        // Fetch customer addresses, matching against the invoice's saved address
        if (customerId) {
          fetchCustomerAddresses(customerId, {
            address: invoice.address || '',
            suburb: invoice.suburb || '',
            state: invoice.state || '',
            post_code: invoice.post_code || '',
          });
        }

        // Set payment method states if invoice is paid
        if (invoice.payment_method) {
          // Check if it's a custom payment method
          const predefinedMethods = ["cash", "credit_card", "bank_transfer"];
          if (predefinedMethods.includes(invoice.payment_method)) {
            setSelectedPaymentMethod(invoice.payment_method);
          } else {
            // Custom payment method - set dropdown to "other" and save the custom value
            setSelectedPaymentMethod("other");
            setCustomPaymentMethod(invoice.payment_method);
          }
        }

        // Set initial form values - USE INVOICE ADDRESS, NOT CUSTOMER ADDRESS
        setInitialValues({
          invoice_number: invoice.invoice_number || "",
          contactName: invoice.customers?.name || "",
          inlineCustomerName: "",
          phone: invoice.customers?.phone || "",
          mobile: invoice.customers?.mobile || "",
          address: invoice.address || "", // Use invoice address
          suburb: invoice.suburb || "", // Use invoice suburb
          state: invoice.state || "", // Use invoice state
          postCode: invoice.post_code || "", // Use invoice post code
          emailAddress: invoice.customers?.email || "",
          invoice_date: invoice.invoice_date
            ? getDateFormattedForField(new Date(invoice.invoice_date))
            : getDateFormattedForField(),
          note: invoice.note || "",
          status: invoice.status || "draft",
          delivery_status: invoice.delivery_status || "pending",
          payment_method: invoice.payment_method || "",
        });

        // Load items with warehouse information
        if (invoice.invoice_items) {
          const itemsWithWarehouses = await Promise.all(
            invoice.invoice_items.map(async (item: any) => {
              const allWarehouses = await getWarehousesForItem(item.item_id);
              const sortedWarehouses = [...allWarehouses].sort(
                (a, b) => b.available - a.available,
              );

              return {
                item_id: item.item_id,
                name: item.items?.name || "",
                itemCode: item.items?.itemCode || "",
                quantity: item.quantity.toString(),
                unit_price: item.unit_price.toString(),
                gst: item.items?.gst || false,
                total: calculateItemTotal({
                  quantity: item.quantity.toString(),
                  unit_price: item.unit_price.toString(),
                  gst: item.items?.gst || false,
                }).toString(),
                warehouse_id: item.warehouse_id || 1,
                available_warehouses: sortedWarehouses,
              };
            }),
          );
          setSelectedItems(itemsWithWarehouses);
        }
      }

      // Load customers, items, and warehouses
      await Promise.all([getCustomers(), getItems(), getAllWarehouses()]);
    } catch (error) {
      console.error("Error loading invoice data:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadInvoiceData();
  }, []);

  useEffect(() => {
    if (!createInlineCustomer) {
      getCustomers();
    }
  }, [customerSearch, createInlineCustomer]);

  useEffect(() => {
    getItems();
  }, [itemSearch]);

  // Auto-populate customer details when selected
  useEffect(() => {
    if (selectedCustomer && customers.length > 0) {
      const customer = customers.find((c) => c.id === selectedCustomer);
      if (customer) {
        setSelectedEmail(customer.email || "");
        setCustomerName(customer.name || "");
        setSelectedPhone(customer.phone || "");
        setSelectedMobile(customer.mobile || "");

        // Don't fetch addresses here - they are already loaded during loadInvoiceData()
        // with the correct invoice address match
      }
    } else if (!createInlineCustomer) {
      // Reset customer data
      setSelectedEmail("");
      setCustomerName("");
      setSelectedPhone("");
      setSelectedMobile("");
      setSelectedAddress("");
      setSelectedSuburb("");
      setSelectedState("");
      setSelectedPostCode("");
      setCustomerAddresses([]);
      setSelectedAddressIndex(-1);
    }
  }, [selectedCustomer, customers, createInlineCustomer]);

  return {
    validate,
    onSubmit,
    items,
    customers,
    loading,
    selectedItems,
    addItem,
    removeItem,
    updateItem,
    totalAmount,
    loadingItems,
    loadingCustomers,
    selectedAddress,
    selectedSuburb,
    selectedState,
    selectedEmail,
    selectedPhone,
    selectedMobile,
    selectedPostCode,
    changeAddress,
    selectedItemId,
    setSelectedItemId,
    handleItemSearchDebounced,
    handleSearchDebounced,
    initialValues,
    currentStatus,
    invoiceData,
    selectedCustomer,
    setSelectedCustomer,
    createInlineCustomer,
    setCreateInlineCustomer: setCreateInlineCustomerWithReset,
    inlineCustomerName,
    setInlineCustomerName,
    customerName,
    setCustomerName,
    // New properties for address selection
    customerAddresses,
    selectedAddressIndex,
    handleAddressSelect,
    customerId,
    // Payment method properties
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    customPaymentMethod,
    setCustomPaymentMethod,
  };
}