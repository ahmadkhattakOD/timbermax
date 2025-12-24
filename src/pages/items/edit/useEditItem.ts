import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import ItemsRepository, {
  ItemSupabase,
} from "utils/repositories/itemsRepository";

export interface ValuesEditItem {
  name: string;
  description: string;
  itemCode: string;
  sellPrice: string;
  purchasePrice: string;
  gst:boolean
}

export function useEditItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const { id } = useParams();

  function validate(values: ValuesEditItem) {
    const errors = {} as ValuesEditItem;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    if (!values.itemCode.trim()) {
      errors.itemCode = "required";
    }

    // For sellPrice, check if it's falsy or empty
    const sellPriceStr = String(values.sellPrice || '');
    if (sellPriceStr === '' || sellPriceStr === '0' || sellPriceStr === 'null' || sellPriceStr === 'undefined') {
      errors.sellPrice = "required";
    } else {
      const sellPriceNum = parseFloat(sellPriceStr);
      if (isNaN(sellPriceNum) || sellPriceNum < 0) {
        errors.sellPrice = "must be a valid number";
      }
    }

    // For purchasePrice, check if it's falsy or empty
    const purchasePriceStr = String(values.purchasePrice || '');
    if (purchasePriceStr === '' || purchasePriceStr === '0' || purchasePriceStr === 'null' || purchasePriceStr === 'undefined') {
      errors.purchasePrice = "required";
    } else {
      const purchasePriceNum = parseFloat(purchasePriceStr);
      if (isNaN(purchasePriceNum) || purchasePriceNum < 0) {
        errors.purchasePrice = "must be a valid number";
      }
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditItem) {
    try {
      if (id && isNumeric(id)) {
        // Convert to numbers, handling any string representation
        const sellPriceNum = values.sellPrice ? parseFloat(values.sellPrice.toString()) : 0;
        const purchasePriceNum = values.purchasePrice ? parseFloat(values.purchasePrice.toString()) : 0;
        
        const updatedItem: ItemSupabase = {
          name: values.name,
          description: values.description,
          itemCode: values.itemCode,
          sellPrice: sellPriceNum,
          purchasePrice: purchasePriceNum,
          gst:values.gst || false
        };

        const itemsRepository = new ItemsRepository();
        const editedItem = await itemsRepository.edit(
          parseInt(id),
          updatedItem
        );

        if (editedItem) {
          openSnackbar({
            open: true,
            message: "Item edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message: "Item could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate("/items");
      } else {
        openSnackbar({
          open: true,
          message: "Item could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);

        navigate("/items");
      }
    } catch (e) {
      console.error("Error editing item:", e);
      openSnackbar({
        open: true,
        message: "Item could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate("/items");
    }
  }

  async function getItem() {
    setLoading(true);
    if (id && isNumeric(id)) {
      const itemsRepository = new ItemsRepository();
      const existingItem = await itemsRepository.getSingle(parseInt(id));
      if (existingItem) {
        const { itemData, itemError } = existingItem;
        if (itemData && !itemError) {
          setItem(itemData);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getItem();
  }, []);

  return { validate, onSubmit, item, loading };
}