import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import ItemsRepository from "utils/repositories/itemsRepository";
import StocksRepository, {
  StockSupabase,
} from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";

export interface ValuesCreateStock {
  item: string;
  warehouse: string;
  quantity: string;
  notes?: string; // ✅ Optional notes field
}

export function useCreateStock() {
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

    // Notes are optional, no validation needed

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
      
      // ✅ Pass optional notes to create method
      // UserId is now handled automatically inside the repository via Supabase auth
      const createdStock = await stocksRepository.create(
        newStock,
        values.notes || undefined  // Pass notes if provided
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

  async function getItemsWarehouses() {
    setLoading(true);
    const itemsRepository = new ItemsRepository();
    const allItems = await itemsRepository.getWithoutFilters();
    if (allItems) {
      const { itemsData, itemsError } = allItems;
      if (itemsData && !itemsError) {
        setItems(itemsData);
      }
    }
    const warehousesRepository = new WarehousesRepository();
    const allWarehouses = await warehousesRepository.getWithoutFilters();
    if (allWarehouses) {
      const { warehousesData, warehousesError } = allWarehouses;
      if (warehousesData && !warehousesError) {
        setWarehouses(warehousesData);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getItemsWarehouses();
  }, []);

  return { items, warehouses, loading, validate, onSubmit };
}