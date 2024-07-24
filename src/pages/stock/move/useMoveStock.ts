import { openSnackbar } from "api/snackbar";
import { FormikProps } from "formik";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import ItemsRepository from "utils/repositories/itemsRepository";
import StocksRepository, {
  StockSupabase,
} from "utils/repositories/stocksRepository";
import WarehousesRepository from "utils/repositories/warehousesRepository";

export interface ValuesMoveStock {
  fromWarehouse: string;
  item: string;
  toWarehouse: string;
  quantity: string;
}

export function useMoveStock() {
  const navigate = useNavigate();
  const formikRef = useRef<FormikProps<ValuesMoveStock>>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState(-1);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function validate(values: ValuesMoveStock) {
    const errors = {} as ValuesMoveStock;

    if (!values.fromWarehouse) {
      errors.fromWarehouse = "required";
    }

    if (!values.item) {
      errors.item = "required";
    }

    if (!values.toWarehouse) {
      errors.toWarehouse = "required";
    }

    if (!values.quantity || parseInt(values.quantity) < 0) {
      errors.quantity = "required-valid-number";
    }

    if (parseInt(values.quantity) > selectedQuantity) {
      errors.quantity = "required-lesser-than-limit";
    }

    return errors;
  }

  async function onSubmit(values: ValuesMoveStock) {
    try {
      const newStock: StockSupabase = {
        item: parseInt(values.item),
        warehouse: parseInt(values.toWarehouse),
        quantity: parseInt(values.quantity),
        updated_at: new Date(),
      };
      const moveStock: StockSupabase = {
        item: parseInt(values.item),
        warehouse: parseInt(values.fromWarehouse),
        quantity: parseInt(values.quantity),
        updated_at: new Date(),
      };
      const stocksRepository = new StocksRepository();
      const movedStock = await stocksRepository.move(moveStock);
      if (movedStock) {
        const createdStock = await stocksRepository.create(newStock);

        if (createdStock) {
          openSnackbar({
            open: true,
            message: "Stock moved successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message: "Stock could not be moved successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }
      } else {
        openSnackbar({
          open: true,
          message: "Stock could not be moved successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      }

      navigate("/stock");
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Stock could not be moved successfully. Please try again.",
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

  async function getStockItemsForWarehouse(warehouse: number) {
    const stocksRepository = new StocksRepository();
    const stocks = await stocksRepository.getByWarehouse(warehouse);
    if (stocks) {
      const { stocksData, stocksError } = stocks;
      if (stocksData && !stocksError) {
        setStocks(stocksData);
        setSelectedQuantity(0);
        formikRef.current?.setFieldValue("item", "");
        formikRef.current?.setFieldTouched("item", false);
      }
    }
  }

  function getAvailableQuantity(item: number) {
    const selectedStock = stocks.find((stock) => stock.item.id == item);
    if (selectedStock) {
      setSelectedQuantity(selectedStock.quantity);
    }
  }

  function onFormChange(event: any) {
    const target = event.target as HTMLInputElement;
    if (target.name === "fromWarehouse") {
      getStockItemsForWarehouse(parseInt(target.value));
    }
    else if (target.name === "item") {
      getAvailableQuantity(parseInt(target.value));
    }
  }

  useEffect(() => {
    getItemsWarehouses();
  }, []);

  return {
    formikRef,
    validate,
    onSubmit,
    loading,
    stocks,
    warehouses,
    onFormChange,
    selectedQuantity,
  };
}
