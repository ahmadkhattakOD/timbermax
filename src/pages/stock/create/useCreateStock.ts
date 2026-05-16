import { openSnackbar } from "api/snackbar";
import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import ItemsRepository from "utils/repositories/itemsRepository";
import StocksRepository, {
  StockSupabase,
} from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";
import { useDebouncedSearch } from "utils/helpers";

export interface ValuesCreateStock {
  item: string;
  warehouse: string;
  quantity: string;
  notes?: string;
}

export function useCreateStock() {
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any | null>(null);
  const navigate = useNavigate();

  function validate(values: ValuesCreateStock) {
    const errors = {} as ValuesCreateStock;

    if (!values.item) {
      errors.item = "required";
    }

    if (!values.warehouse) {
      errors.warehouse = "required";
    }

    if (!values.quantity || parseInt(values.quantity) <= 0) {
      errors.quantity = "required-valid-number";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateStock) {
    try {
      const newStock: StockSupabase = {
        item: parseInt(values.item),
        warehouse: parseInt(values.warehouse),
        quantity: parseInt(values.quantity),
        updated_at: new Date(),
      };

      const stocksRepository = new StocksRepository();
      const createdStock = await stocksRepository.create(
        newStock,
        values.notes || undefined
      );

      if (createdStock) {
        openSnackbar({
          open: true,
          message: "Stock added successfully.",
          variant: "alert",
          alert: {
            color: "success",
          },
        } as SnackbarProps);
        navigate("/stock");
      } else {
        openSnackbar({
          open: true,
          message:
            "Stock could not be added successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      }
    } catch (e) {
      console.error("Error creating stock:", e);
      openSnackbar({
        open: true,
        message: "Stock could not be added successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      navigate("/stock");
    }
  }

  async function getItems() {
    setLoadingItems(true);
    const itemsRepository = new ItemsRepository();
    const result = await itemsRepository.getByName(itemSearch, 200);
    if (result?.itemsData) {
      setItems(result.itemsData);
    }
    setLoadingItems(false);
  }

  async function getWarehouses() {
    setLoadingWarehouses(true);
    const warehousesRepository = new WarehousesRepository();
    const result = await warehousesRepository.getByName(warehouseSearch, 200);
    if (result?.warehousesData) {
      setWarehouses(result.warehousesData);
    }
    setLoadingWarehouses(false);
  }

  function handleItemSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setItemSearch(e.target.value);
  }

  const handleItemSearchDebounced = useDebouncedSearch(handleItemSearchChange);

  function handleWarehouseSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setWarehouseSearch(e.target.value);
  }

  const handleWarehouseSearchDebounced = useDebouncedSearch(handleWarehouseSearchChange);

  useEffect(() => {
    getItems();
  }, [itemSearch]);

  useEffect(() => {
    getWarehouses();
  }, [warehouseSearch]);

  return {
    items,
    warehouses,
    loadingItems,
    loadingWarehouses,
    selectedItem,
    setSelectedItem,
    selectedWarehouse,
    setSelectedWarehouse,
    handleItemSearchDebounced,
    handleWarehouseSearchDebounced,
    validate,
    onSubmit,
  };
}
