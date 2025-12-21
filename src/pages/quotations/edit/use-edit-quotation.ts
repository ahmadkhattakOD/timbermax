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
  customerName: string;
  phone: string;
  mobile: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
  emailAddress: string;
  valid_until: string;
  note: string;
  status: "draft" | "sent" | "approved" | "cancelled";
}

export function useEditQuotation(quotationId: number) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [selectedMobile, setSelectedMobile] = useState<string>("");
  const [selectedPostCode, setSelectedPostCode] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [itemSearch, setItemSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quotationData, setQuotationData] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<any>("draft");

  const [initialValues, setInitialValues] = useState<ValuesEditQuotation>({
    quotation_number: "",
    customerName: "",
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

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.unit_price),
    0
  );

  function changeAddress(newValue: any, actionMeta: any) {
    let addressComponents = parseAddress(newValue?.value?.description ?? "");
    setSelectedSuburb(addressComponents.suburb);
    setSelectedState(addressComponents.state);
    setSelectedAddress(newValue?.value?.description ?? "");
  }

  function handleItemSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setItemSearch(e.target.value);
  }

  const handleItemSearchDebounced = useDebouncedSearch(handleItemSearchChange);

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
    // Just remove from local state - no API calls
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

  function validate(values: ValuesEditQuotation) {
    const errors: Partial<ValuesEditQuotation> = {};

    if (!values.quotation_number) {
      errors.quotation_number = "required";
    }

    if (!values.customerName || !values.customerName.trim()) {
      errors.customerName = "required";
    }

    if (!values.status) {
      errors.status = "required" as any;
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditQuotation) {
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

      // Update customer details
      if (customerId) {
        const customersRepo = new CustomersRepository();
        await customersRepo.edit(customerId, {
          name: values.customerName,
          phone: values.phone,
          mobile: values.mobile,
          address: values.address,
          suburb: values.suburb,
          state: values.state,
          post_code: values.postCode,
          email: values.emailAddress,
        });
      }

      const quotationsRepo = new QuotationsRepository();
      const stocksRepo = new StocksRepository();

      // Get current items from database
      const currentItemsResult = await quotationsRepo.getItems(quotationId);
      const currentItems = currentItemsResult?.data || [];

      // Check if status changed to cancelled
      const statusChangedToCancelled = 
        currentStatus !== "cancelled" && values.status === "cancelled";

      // If changing to cancelled, release all stock first
      if (statusChangedToCancelled) {
        for (const item of currentItems) {
          const reservations = await stocksRepo.getReservedStockByItem(
            item.item_id,
            1
          );
          const quotationReservations =
            reservations.data?.filter(
              (res: any) =>
                res.quotation_id === quotationId && res.status === "on_hold"
            ) || [];

          for (const reservation of quotationReservations) {
            await stocksRepo.releaseFromQuotation(
              quotationId,
              item.item_id,
              1,
              parseFloat(reservation.quantity)
            );
          }
        }
      }

      // Update quotation status and details
      const updatedQuotation: Partial<QuotationSupabase> = {
        customer_id: customerId,
        total: totalAmount,
        valid_until: values.valid_until ? new Date(values.valid_until) : null,
        note: values.note,
        status: values.status,
      };

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

      // Only update items if status is not cancelled
      if (values.status !== "cancelled") {
        // Identify items to remove
        const currentItemIds = currentItems.map((item: any) => item.item_id);
        const newItemIds = selectedItems.map((item) => item.item_id);

        // Items to remove (in current but not in new)
        const itemsToRemove = currentItems.filter(
          (item: any) => !newItemIds.includes(item.item_id)
        );

        // Remove items that are no longer in the quotation
        for (const item of itemsToRemove) {
          // Delete item from quotation_items
          await quotationsRepo.deleteItem(quotationId, item.item_id);

          // Release stock for removed items
          const reservations = await stocksRepo.getReservedStockByItem(
            item.item_id,
            1
          );
          const quotationReservations =
            reservations.data?.filter(
              (res: any) =>
                res.quotation_id === quotationId && res.status === "on_hold"
            ) || [];

          for (const reservation of quotationReservations) {
            await stocksRepo.releaseFromQuotation(
              quotationId,
              item.item_id,
              1,
              parseFloat(reservation.quantity)
            );
          }
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

            await quotationsRepo.updateItem(quotationId, itemId, {
              quantity: newQuantity,
              unit_price: itemUnitPrice,
            });

            // Adjust stock if quantity changed
            if (newQuantity !== currentQuantity) {
              const quantityDiff = newQuantity - currentQuantity;

              if (quantityDiff > 0) {
                // Need more stock
                const reserveResult = await stocksRepo.reserveForQuotation(
                  itemId,
                  1,
                  quantityDiff,
                  quotationId
                );

                if (!reserveResult.success) {
                  console.warn(
                    `Failed to reserve additional stock for item ${itemId}:`,
                    reserveResult.error
                  );
                }
              } else if (quantityDiff < 0) {
                // Need to release stock
                const releaseAmount = Math.abs(quantityDiff);

                const reservations = await stocksRepo.getReservedStockByItem(
                  itemId,
                  1
                );
                const quotationReservations =
                  reservations.data?.filter(
                    (res: any) =>
                      res.quotation_id === quotationId && res.status === "on_hold"
                  ) || [];

                let remainingToRelease = releaseAmount;
                for (const reservation of quotationReservations) {
                  if (remainingToRelease <= 0) break;

                  const releaseQuantity = Math.min(
                    remainingToRelease,
                    parseFloat(reservation.quantity)
                  );
                  await stocksRepo.releaseFromQuotation(
                    quotationId,
                    itemId,
                    1,
                    releaseQuantity
                  );
                  remainingToRelease -= releaseQuantity;
                }
              }
            }
          } else {
            // Add new item
            await quotationsRepo.addItem({
              quotation_id: quotationId,
              item_id: itemId,
              quantity: newQuantity,
              unit_price: itemUnitPrice,
            });

            // Reserve stock for new item
            const reserveResult = await stocksRepo.reserveForQuotation(
              itemId,
              1,
              newQuantity,
              quotationId
            );

            if (!reserveResult.success) {
              console.warn(
                `Failed to reserve stock for new item ${itemId}:`,
                reserveResult.error
              );
            }
          }
        }

        // Update quotation total
        await quotationsRepo.updateQuotationTotal(quotationId);
      }

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

  async function getItems() {
    setLoadingItems(true);
    const itemsRepository = new ItemsRepository();
    const allItems = await itemsRepository.getByName(itemSearch || "");
    if (allItems?.itemsData) {
      setItems(allItems.itemsData);
    }
    setLoadingItems(false);
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

        // Set customer data
        setCustomerId(quotation.customer_id);
        setCustomerName(quotation.customers?.name || "");
        setSelectedPhone(quotation.customers?.phone || "");
        setSelectedMobile(quotation.customers?.mobile || "");
        setSelectedEmail(quotation.customers?.email || "");
        setSelectedAddress(quotation.customers?.address || "");
        setSelectedSuburb(quotation.customers?.suburb || "");
        setSelectedState(quotation.customers?.state || "");
        setSelectedPostCode(quotation.customers?.post_code || "");

        // Set initial form values
        setInitialValues({
          quotation_number: quotation.quotation_number || "",
          customerName: quotation.customers?.name || "",
          phone: quotation.customers?.phone || "",
          mobile: quotation.customers?.mobile || "",
          address: quotation.customers?.address || "",
          suburb: quotation.customers?.suburb || "",
          state: quotation.customers?.state || "",
          postCode: quotation.customers?.post_code || "",
          emailAddress: quotation.customers?.email || "",
          valid_until: quotation.valid_until
            ? getDateFormattedForField(new Date(quotation.valid_until))
            : "",
          note: quotation.note || "",
          status: quotation.status || "draft",
        });

        // Set items
        if (quotation.quotation_items) {
          const itemsWithDetails = quotation.quotation_items.map(
            (item: any) => ({
              item_id: item.item_id,
              name: item.items?.name || "",
              itemCode: item.items?.itemCode || "",
              quantity: item.quantity.toString(),
              unit_price: item.unit_price.toString(),
              total: (
                parseFloat(item.quantity) * parseFloat(item.unit_price)
              ).toString(),
            })
          );
          setSelectedItems(itemsWithDetails);
        }
      }

      // Load items
      await getItems();
    } catch (error) {
      console.error("Error loading quotation data:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadQuotationData();
  }, []);

  useEffect(() => {
    getItems();
  }, [itemSearch]);

  return {
    validate,
    onSubmit,
    items,
    loading,
    selectedItems,
    addItem,
    removeItem,
    updateItem,
    totalAmount,
    loadingItems,
    selectedAddress,
    selectedSuburb,
    selectedState,
    selectedEmail,
    selectedPhone,
    selectedMobile,
    selectedPostCode,
    changeAddress,
    setSelectedSuburb,
    setSelectedState,
    setSelectedEmail,
    setSelectedPhone,
    setSelectedMobile,
    setSelectedPostCode,
    selectedItemId,
    setSelectedItemId,
    handleItemSearchDebounced,
    initialValues,
    currentStatus,
    quotationData,
    customerName,
    setCustomerName,
  };
}