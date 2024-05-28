import { openSnackbar } from "api/snackbar";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import ItemsRepository, {
  ItemSupabase,
} from "utils/repositories/items-repository";
import WarehousesRepository, {
  WarehouseSupabase,
} from "utils/repositories/warehouses-repository";

export interface ValuesCreateItem {
  name: string;
  description: string;
}

export function useCreateItem() {
  const navigate = useNavigate();

  function validate(values: ValuesCreateItem) {
    const errors = {} as ValuesCreateItem;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateItem) {
    try {
      const newItem: ItemSupabase = {
        name: values.name,
        description: values.description,
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
