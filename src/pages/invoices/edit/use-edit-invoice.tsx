import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import {
  parseAddress,
  useDebouncedSearch,
  getDateFormattedForField,
  calculateItemTotal,
} from "utils/helpers";
import CustomersRepository, {
  CustomerSupabase,
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import InvoicesRepository, {
  InvoiceSupabase,
} from "utils/repositories/invoicesRepository";
import StocksRepository from "utils/repositories/stocksRepository";

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
}

export function useEditInvoice(invoiceId: number) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
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
  });

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + calculateItemTotal(item),
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
      // Recalculate total with GST
      const quantity = newQuantity;
      const unitPrice = parseFloat(updatedItems[existingIndex].unit_price);
      const baseTotal = quantity * unitPrice;
      const gstAmount = updatedItems[existingIndex].gst ? baseTotal * 0.1 : 0;

      updatedItems[existingIndex].total = (baseTotal + gstAmount).toString();
      setSelectedItems(updatedItems);
    } else {
      // Add new item with GST
      const newItem = {
        item_id: item.id,
        name: item.name,
        itemCode: item.itemCode,
        quantity: "1",
        unit_price: item?.sellPrice || 0,
        gst: item?.gst || false,
        total: calculateItemTotal({
          quantity: "1",
          unit_price: item?.sellPrice || 0,
          gst: item?.gst || false,
        }).toString(),
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

    // Recalculate total for the item with GST
    const quantity = parseFloat(updatedItems[index].quantity);
    const unit_price = parseFloat(updatedItems[index].unit_price);
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

    if (!values.status) {
      errors.status = "required" as any;
    }

    if (!values.delivery_status) {
      errors.delivery_status = "required" as any;
    }

    if (selectedItems.length === 0) {
      openSnackbar({
        open: true,
        message: "Please add at least one item to the invoice",
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
        // For existing customer mode
        if (selectedCustomer) {
          customerToUpdate = selectedCustomer;
        } else {
          // No customer selected, find or create by name
          const customerNameToUse = values.contactName;

          // First, try to find existing customer by name
          const customersRepository = new CustomersRepository();
          const existingCustomers = await customersRepository.getByName(customerNameToUse);
          let existingCustomer = null;

          if (existingCustomers?.customersData) {
            existingCustomer = existingCustomers.customersData.find(
              (c: any) => c.name === customerNameToUse
            );
          }

          if (existingCustomer) {
            // Customer exists, use it
            customerToUpdate = existingCustomer.id;
            
            // Update customer details
            await customersRepository.edit(existingCustomer.id, {
              name: customerNameToUse,
              phone: values.phone,
              mobile: values.mobile,
              address: values.address,
              suburb: values.suburb,
              state: values.state,
              post_code: values.postCode,
              email: values.emailAddress,
            });
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

            const createdCustomer = await customersRepository.create(newCustomer);
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

      // Get current invoice items from database
      const currentItemsResult = await invoicesRepo.getItems(invoiceId);
      const currentItems = currentItemsResult?.data || [];

      // Check if status changed to cancelled
      const statusChangedToCancelled =
        currentStatus !== "cancelled" && values.status === "cancelled";

      // Check if status changed from cancelled to something else
      const statusChangedFromCancelled =
        currentStatus === "cancelled" && values.status !== "cancelled";

      // Handle stock adjustments based on status changes
      if (statusChangedToCancelled) {
        // If changing to cancelled, restore stock
        for (const item of currentItems) {
          await stocksRepo.restoreStockFromInvoice(
            item.item_id,
            1, // default warehouse
            item.quantity
          );
        }
      } else if (statusChangedFromCancelled) {
        // If changing from cancelled back to active, reduce stock again
        for (const item of selectedItems) {
          await stocksRepo.reduceStockForInvoice(
            item.item_id,
            // 1,
            parseFloat(item.quantity),
            invoiceId
          );
        }
      }

      // Calculate total with GST
      const totalWithGST = selectedItems.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0
      );

      // Update invoice details
      const updatedInvoice = {
        customer_id: customerToUpdate,
        total: totalWithGST,
        invoice_date: values.invoice_date ? new Date(values.invoice_date) : null,
        note: values.note,
        status: values.status,
        delivery_status: values.delivery_status,
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
          (item: any) => !newItemIds.includes(item.item_id)
        );

        // Remove items that are no longer in the invoice
        for (const item of itemsToRemove) {
          // Delete item from invoice_items
          await invoicesRepo.deleteItem(invoiceId, item.item_id);

          // Restore stock for removed items
          await stocksRepo.restoreStockFromInvoice(
            item.item_id,
            1,
            item.quantity
          );
        }

        // Update or add items
        for (const selectedItem of selectedItems) {
          const itemId = selectedItem.item_id;
          const newQuantity = parseFloat(selectedItem.quantity);
          const itemUnitPrice = parseFloat(selectedItem.unit_price);

          const currentItem = currentItems.find(
            (item: any) => item.item_id === itemId
          );

          if (currentItem) {
            // Update existing item
            const currentQuantity = parseFloat(currentItem.quantity);

            await invoicesRepo.updateItem(invoiceId, itemId, {
              quantity: newQuantity,
              unit_price: itemUnitPrice,
            });

            // Adjust stock if quantity changed
            if (newQuantity !== currentQuantity) {
              const quantityDiff = newQuantity - currentQuantity;

              if (quantityDiff > 0) {
                // Need more stock reduction
                await stocksRepo.reduceStockForInvoice(
                  itemId,
                  // 1,
                  quantityDiff,
                  invoiceId
                );
              } else if (quantityDiff < 0) {
                // Need to restore stock
                const restoreAmount = Math.abs(quantityDiff);
                await stocksRepo.restoreStockFromInvoice(
                  itemId,
                  1,
                  restoreAmount
                );
              }
            }
          } else {
            // Add new item
            await invoicesRepo.addItem({
              invoice_id: invoiceId,
              item_id: itemId,
              quantity: newQuantity,
              unit_price: itemUnitPrice,
            });

            // Reduce stock for new item
            await stocksRepo.reduceStockForInvoice(
              itemId,
              // 1,
              newQuantity,
              invoiceId
            );
          }
        }
      }

      openSnackbar({
        open: true,
        message: "Invoice updated successfully.",
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
        setCustomerName(invoice.customers?.name || "");
        setSelectedPhone(invoice.customers?.phone || "");
        setSelectedMobile(invoice.customers?.mobile || "");
        setSelectedEmail(invoice.customers?.email || "");
        setSelectedAddress(invoice.customers?.address || "");
        setSelectedSuburb(invoice.customers?.suburb || "");
        setSelectedState(invoice.customers?.state || "");
        setSelectedPostCode(invoice.customers?.post_code || "");

        // Set initial form values
        setInitialValues({
          invoice_number: invoice.invoice_number || "",
          contactName: invoice.customers?.name || "",
          inlineCustomerName: "",
          phone: invoice.customers?.phone || "",
          mobile: invoice.customers?.mobile || "",
          address: invoice.customers?.address || "",
          suburb: invoice.customers?.suburb || "",
          state: invoice.customers?.state || "",
          postCode: invoice.customers?.post_code || "",
          emailAddress: invoice.customers?.email || "",
          invoice_date: invoice.invoice_date
            ? getDateFormattedForField(new Date(invoice.invoice_date))
            : getDateFormattedForField(),
          note: invoice.note || "",
          status: invoice.status || "draft",
          delivery_status: invoice.delivery_status || "pending",
        });

        // Set items
        if (invoice.invoice_items) {
          const itemsWithDetails = invoice.invoice_items.map(
            (item: any) => ({
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
            })
          );
          setSelectedItems(itemsWithDetails);
        }
      }

      // Load customers and items
      await Promise.all([getCustomers(), getItems()]);
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
        setSelectedAddress(customer.address || "");
        setSelectedSuburb(customer.suburb || "");
        setSelectedState(customer.state || "");
        setSelectedPostCode(customer.post_code || "");
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
  };
}