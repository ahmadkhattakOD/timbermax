import { openSnackbar } from "api/snackbar";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { parseAddress, useDebouncedSearch } from "utils/helpers";
import CustomersRepository, {
  CustomerSupabase,
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import QuotationsRepository, {
  QuotationSupabase,
} from "utils/repositories/quotationRepo";

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
  const [itemSearch, setItemSearch] = useState<string>(""); // Add item search state
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false); // Add items loading state
  const [createInlineCustomer, setCreateInlineCustomer] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null); // For item selection
  const [inlineCustomerName, setInlineCustomerName] = useState("");
  const quotationNumberRef = useRef(`QT-${Date.now()}`);

  const totalAmount = selectedItems.reduce(
    (sum, item) =>
      sum + parseFloat(item.quantity) * parseFloat(item.unit_price),
    0
  );

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

  // Add item search handler
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
      console.log("IMTESS", item);
      // Add new item
      const newItem = {
        item_id: item.id,
        name: item.name,
        itemCode: item.itemCode,
        quantity: "1",
        unit_price: item?.sellPrice,
        total: item?.sellPrice.toString(),
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

    return errors;
  }

  async function onSubmit(values: ValuesCreateQuotation) {
    try {
      let customerToAdd = selectedCustomer;
      if (selectedItems.length === 0) {
        openSnackbar({
          open: true,
          message: "Please add at least one item to the quotation",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        return;
      }

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
        status: "draft",
      };

      const quotationsRepo = new QuotationsRepository();

      const itemsForReservation = selectedItems.map((item) => ({
        item_id: item.item_id,
        quantity: parseFloat(item.quantity),
      }));

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

      for (const item of selectedItems) {
        const itemQuantity = parseFloat(item.quantity);
        const itemUnitPrice = parseFloat(item.unit_price);

        await quotationsRepo.addItem({
          quotation_id: quotationId,
          item_id: item.item_id,
          quantity: itemQuantity,
          unit_price: itemUnitPrice,
        });
      }

      openSnackbar({
        open: true,
        message: "Quotation created successfully.",
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

  // Load items when search changes
  useEffect(() => {
    getItems();
  }, [itemSearch]);

  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find((c) => c.id === selectedCustomer);
      if (customer) {
        setSelectedEmail(customer.email || "");
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
    setSelectedSuburb,
    setSelectedState,
    setSelectedEmail,
    setSelectedPhone,
    setSelectedMobile,
    setSelectedPostCode,
    selectedCustomer,
    itemSearch,
    setItemSearch,
    handleItemSearchDebounced,
    loadingItems,
    selectedItemId,
    setSelectedItemId,
    setCreateInlineCustomer: setCreateInlineCustomerWithReset,
    inlineCustomerName,
    quotationNumberRef,
    setInlineCustomerName,
  };
}
