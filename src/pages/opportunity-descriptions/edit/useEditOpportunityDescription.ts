import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import OpportunityDescriptionsRepository, {
  OpportunityDescriptionSupabase,
} from "utils/repositories/opportunityDescriptionsRepository";
import { SelectedItem } from "../create/useCreateOpportunityDescription";
import ItemsRepository from "utils/repositories/itemsRepository";
import OpportunityItemsRepository, {
  OpportunityItemSupabase,
} from "utils/repositories/opportunityItemsRepository";

export interface ValuesEditOpportunityDescription {
  name: string;
  description: string;
}

export function useEditOpportunityDescription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [opportunityDescription, setOpportunityDescription] =
    useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([
    { item: "", quantity: "" },
  ]);
  const { id } = useParams();

  function addSelectedItem() {
    setSelectedItems((prev) => [...prev, { item: "", quantity: "" }]);
  }

  function removeSelectedItem(idx: number) {
    let temp = [...selectedItems];
    temp.splice(idx, 1);
    setSelectedItems(temp);
  }

  function handleChangeSelectedItem(
    valueType: "item" | "quantity",
    value: string,
    idx: number
  ) {
    let temp = [...selectedItems];
    if (valueType === "item") {
      temp[idx].item = value;
    } else {
      temp[idx].quantity = value;
    }
    setSelectedItems(temp);
  }

  function validate(values: ValuesEditOpportunityDescription) {
    const errors = {} as ValuesEditOpportunityDescription;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditOpportunityDescription) {
    try {
      if (id && isNumeric(id)) {
        const updatedItem: OpportunityDescriptionSupabase = {
          name: values.name,
          description: values.description,
        };

        const opportunityDescriptionsRepository =
          new OpportunityDescriptionsRepository();
        const editedOpportunity = await opportunityDescriptionsRepository.edit(
          parseInt(id),
          updatedItem
        );

        if (editedOpportunity) {
          const itemsToProcess = selectedItems.filter(
            (si) =>
              si.item !== "" && si.quantity !== "" && parseInt(si.quantity) > 0
          );

          const opportunityItemsRepository = new OpportunityItemsRepository();
          await opportunityItemsRepository.deleteByOpportunity(
            editedOpportunity.id
          );

          for (let i = 0; i < itemsToProcess.length; i++) {
            const newOpportunityItem: OpportunityItemSupabase = {
              opportunity: editedOpportunity.id,
              item: parseInt(itemsToProcess[i].item),
              quantity: parseInt(itemsToProcess[i].quantity),
            };

            await opportunityItemsRepository.create(newOpportunityItem);
          }

          openSnackbar({
            open: true,
            message: "Opportunity Description edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Opportunity Description could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate("/opportunity-descriptions");
      } else {
        openSnackbar({
          open: true,
          message:
            "Opportunity Description could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      }

      navigate("/opportunity-descriptions");
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Opportunity Description could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }

    navigate("/opportunity-descriptions");
  }

  async function getOpportunityDescription() {
    setLoading(true);
    if (id && isNumeric(id)) {
      const opportunityDescriptionsRepository =
        new OpportunityDescriptionsRepository();
      const existingOpportunity =
        await opportunityDescriptionsRepository.getSingle(parseInt(id));
      if (existingOpportunity) {
        const { opportunityData, opportunityError } = existingOpportunity;
        if (opportunityData && !opportunityError) {
          setOpportunityDescription(opportunityData);
        }
      }
    }
  }

  async function getItemsOpportunityItems() {
    if (id && isNumeric(id)) {
      const opportunityItemsRepository = new OpportunityItemsRepository();
      const opportunityItems = await opportunityItemsRepository.get(
        parseInt(id)
      );
      if (opportunityItems) {
        const { opportunityItemsData, opportunityItemsError } =
          opportunityItems;
        if (opportunityItemsData && !opportunityItemsError) {
          let temp: SelectedItem[] = [];
          for (let i = 0; i < opportunityItemsData.length; i++) {
            let selectedItem: SelectedItem = {
              item: opportunityItemsData[i].item.toString(),
              quantity: opportunityItemsData[i].quantity.toString(),
            };
            temp.push(selectedItem);
          }
          if (temp.length === 0) {
            temp.push({ item: "", quantity: "" });
          }
          setSelectedItems(temp);
        }
      }
      const itemsRepository = new ItemsRepository();
      const allItems = await itemsRepository.getWithoutFilters();
      if (allItems) {
        const { itemsData, itemsError } = allItems;
        if (itemsData && !itemsError) {
          setItems(itemsData);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getOpportunityDescription();
    getItemsOpportunityItems();
  }, []);

  return {
    validate,
    onSubmit,
    opportunityDescription,
    loading,
    selectedItems,
    addSelectedItem,
    removeSelectedItem,
    handleChangeSelectedItem,
    items,
  };
}
