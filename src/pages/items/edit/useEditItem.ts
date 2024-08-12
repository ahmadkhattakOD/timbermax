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
  committed: string;
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

    if (values.committed && parseInt(values.committed) < 0) {
      errors.committed = "required-valid-number-positive";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditItem) {
    try {
      if (id && isNumeric(id)) {
        const updatedItem: ItemSupabase = {
          name: values.name,
          description: values.description,
          committed: parseInt(values.committed),
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
