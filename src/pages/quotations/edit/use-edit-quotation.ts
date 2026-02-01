import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
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
} from "utils/repositories/customersRepository";
import ItemsRepository from "utils/repositories/itemsRepository";
import QuotationsRepository, {
  QuotationSupabase,
} from "utils/repositories/quotationRepo";
import StocksRepository from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";
import supabase from "utils/supabase";

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
  status: "draft" | "sent" | "approved" | "cancelled" | "converted";
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

export function useEditQuotation(quotationId: number) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
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
      // Recalculate total with GST
      const quantity = newQuantity;
      const unitPrice = Number(updatedItems[existingIndex].unit_price);
      const baseTotal = quantity * unitPrice;
      const gstAmount = updatedItems[existingIndex].gst ? baseTotal * 0.1 : 0;

      updatedItems[existingIndex].total = (baseTotal + gstAmount).toString();
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
      const newItem: QuotationItem = {
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

    // Recalculate total for the item with GST
    const quantity = parseFloat(updatedItems[index].quantity);
    const unit_price = Number(updatedItems[index].unit_price);
    const baseTotal = quantity * unit_price;
    const gstAmount = updatedItems[index].gst ? baseTotal * 0.1 : 0;

    updatedItems[index].total = (baseTotal + gstAmount).toString();
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

      // Calculate total with GST included
      const totalWithGST = selectedItems.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0,
      );

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

      // Get current items from database with warehouse info
      const currentItemsResult = await quotationsRepo.getItems(quotationId);
      const currentItems = currentItemsResult?.data || [];

      // Check status changes
      const statusChangedToCancelled =
        currentStatus !== "cancelled" && values.status === "cancelled";

      const statusChangedFromCancelled =
        currentStatus === "cancelled" && values.status !== "cancelled";

      // Handle stock adjustments based on status changes
      if (statusChangedToCancelled) {
        // If changing to cancelled, release stock for each item in its respective warehouse
        for (const item of currentItems) {
          const warehouseId = item.warehouse_id || 1;
          await stocksRepo.releaseFromQuotation(
            quotationId,
            item.item_id,
            warehouseId,
            item.quantity,
          );
        }
      } else if (statusChangedFromCancelled) {
        // If changing from cancelled back to active, reserve stock again
        for (const selectedItem of selectedItems) {
          const warehouseId = selectedItem.warehouse_id || 1;
          await stocksRepo.reserveForQuotation(
            selectedItem.item_id,
            warehouseId,
            parseFloat(selectedItem.quantity),
            quotationId,
          );
        }
      }

      // Update quotation status and details with GST-calculated total
      const updatedQuotation: Partial<QuotationSupabase> = {
        customer_id: customerId,
        total: totalWithGST,
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
          (item: any) => !newItemIds.includes(item.item_id),
        );

        // Remove items that are no longer in the quotation
        for (const item of itemsToRemove) {
          // Delete item from quotation_items
          await quotationsRepo.deleteItem(quotationId, item.item_id);

          // Release stock for removed items in the correct warehouse
          const warehouseId = item.warehouse_id || 1;
          await stocksRepo.releaseFromQuotation(
            quotationId,
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

            // Update quotation item with warehouse - stock movements handled by updateItem method
            await quotationsRepo.updateItem(quotationId, itemId, {
              quantity: newQuantity,
              unit_price: itemUnitPrice,
              warehouse_id: warehouseId,
            });
          } else {
            // Add new item with warehouse
            await quotationsRepo.addItem({
              quotation_id: quotationId,
              item_id: itemId,
              quantity: newQuantity,
              unit_price: itemUnitPrice,
              warehouse_id: warehouseId,
            });

            // Reserve stock for new item in specified warehouse
            await stocksRepo.reserveForQuotation(
              itemId,
              warehouseId,
              newQuantity,
              quotationId,
            );
          }
        }

        // Update quotation total with GST
        await quotationsRepo.updateQuotationTotal(quotationId);
      }

      // Show success message
      const lowStockItems = selectedItems.filter((item) => {
        if (item.warehouse_id) {
          const selectedWarehouse = item.available_warehouses.find(
            (w) => w.id === item.warehouse_id,
          );
          const requestedQuantity = parseFloat(item.quantity);
          return (
            selectedWarehouse && requestedQuantity > selectedWarehouse.available
          );
        }
        return false;
      });

      if (lowStockItems.length > 0) {
        openSnackbar({
          open: true,
          message: `Quotation updated successfully! ⚠️ ${lowStockItems.length} item(s) have insufficient stock but were still reserved.`,
          variant: "alert",
          alert: { color: "warning" },
        } as SnackbarProps);
      } else {
        openSnackbar({
          open: true,
          message: "Quotation updated successfully with stock tracking.",
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
      }

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

        // Load items with warehouse information
        if (quotation.quotation_items) {
          const itemsWithWarehouses = await Promise.all(
            quotation.quotation_items.map(async (item: any) => {
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
