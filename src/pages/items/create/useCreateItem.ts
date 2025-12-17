import { openSnackbar } from "api/snackbar";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import ItemsRepository, {
  ItemSupabase,
} from "utils/repositories/itemsRepository";

export interface ValuesCreateItem {
  name: string;
  description: string;
  itemCode: string;
  sellPrice: string;
  purchasePrice: string;
}

export function useCreateItem() {
  const navigate = useNavigate();

  function validate(values: ValuesCreateItem) {
    const errors = {} as ValuesCreateItem;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    if (!values.itemCode.trim()) {
      errors.itemCode = "required";
    }

    // For number fields, check if they're falsy (null, undefined, empty string)
    if (!values.sellPrice) {
      errors.sellPrice = "required";
    } else {
      // Now we know sellPrice has a value, but it might not be a string
      // Convert to string first
      const sellPriceStr = values.sellPrice.toString();
      const sellPriceNum = parseFloat(sellPriceStr);
      if (isNaN(sellPriceNum) || sellPriceNum < 0) {
        errors.sellPrice = "must be a valid number";
      }
    }

    if (!values.purchasePrice) {
      errors.purchasePrice = "required";
    } else {
      const purchasePriceStr = values.purchasePrice.toString();
      const purchasePriceNum = parseFloat(purchasePriceStr);
      if (isNaN(purchasePriceNum) || purchasePriceNum < 0) {
        errors.purchasePrice = "must be a valid number";
      }
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateItem) {
    try {
      // Convert to numbers, handling any string representation
      const sellPriceNum = values.sellPrice ? parseFloat(values.sellPrice.toString()) : 0;
      const purchasePriceNum = values.purchasePrice ? parseFloat(values.purchasePrice.toString()) : 0;
      
      const newItem: ItemSupabase = {
        name: values.name,
        description: values.description,
        itemCode: values.itemCode,
        sellPrice: sellPriceNum,
        purchasePrice: purchasePriceNum,
      };

      const itemsRepository = new ItemsRepository();
      const createdItem = await itemsRepository.create(newItem);

      if (createdItem) {
        openSnackbar({
          open: true,
          message: "Item added successfully.",
          variant: "alert",
          alert: {
            color: "success",
          },
        } as SnackbarProps);
      } else {
        openSnackbar({
          open: true,
          message: "Item could not be added successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      }

      navigate("/items");
    } catch (e) {
      console.error("Error creating item:", e);
      openSnackbar({
        open: true,
        message: "Item could not be added successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      navigate("/items");
    }
  }
  return { validate, onSubmit };
}