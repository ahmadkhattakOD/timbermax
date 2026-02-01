import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import ItemsRepository from "utils/repositories/itemsRepository";
import StocksRepository, {
  StockSupabase,
} from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";

export interface ValuesEditStock {
  item: string;
  warehouse: string;
  quantity: string;
  newQuantity: string;
  notes: string;
}

export function useEditStock() {
  const navigate = useNavigate();
  const [stock, setStock] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  function validate(values: ValuesEditStock) {
    const errors = {} as ValuesEditStock;

    if (!values.item) {
      errors.item = "required";
    }

    if (!values.warehouse) {
      errors.warehouse = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditStock) {
    try {
      if (id && isNumeric(id)) {
        const updatedStock = {
          item: parseInt(values.item),
          warehouse: parseInt(values.warehouse),
          quantity: parseInt(values.newQuantity),
          updated_at: new Date(),
          notes: String(values.notes),
        };

        const stocksRepository = new StocksRepository();
        const editedStock = await stocksRepository.create(
          updatedStock,
          values.notes,
        );

        if (editedStock) {
          openSnackbar({
            open: true,
            message: "Stock edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Stock could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate("/stock");
      } else {
        openSnackbar({
          open: true,
          message: "Stock could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);

        navigate("/stock");
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Stock could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate("/stock");
    }
  }

  async function getStock() {
    setLoading(true);
    if (id && isNumeric(id)) {
      const stocksRepository = new StocksRepository();
      const existingStock = await stocksRepository.getSingle(parseInt(id));
      if (existingStock) {
        const { stockData, stockError } = existingStock;
        if (stockData && !stockError) {
          setStock(stockData);
        }
      }
    }
  }

  async function getItemsWarehouses() {
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
    getStock();
    getItemsWarehouses();
  }, []);

  return { validate, onSubmit, stock, loading, items, warehouses };
}
