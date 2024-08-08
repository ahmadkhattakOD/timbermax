import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import ItemsRepository from "utils/repositories/itemsRepository";
import OpportunityDescriptionsRepository, {
  OpportunityDescriptionSupabase,
} from "utils/repositories/opportunityDescriptionsRepository";
import OpportunityItemsRepository, {
  OpportunityItemSupabase,
} from "utils/repositories/opportunityItemsRepository";

export interface ValuesCreateOpportunityDescription {
  name: string;
  description: string;
}

export interface SelectedItem {
  item: string;
  quantity: string;
}

export function useCreateOpportunityDescription() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([
    { item: "", quantity: "" },
  ]);
  const [loading, setLoading] = useState<boolean>(true);

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

  function validate(values: ValuesCreateOpportunityDescription) {
    const errors = {} as ValuesCreateOpportunityDescription;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateOpportunityDescription) {
    try {
      const newOpportunity: OpportunityDescriptionSupabase = {
        name: values.name,
        description: values.description,
      };

      const opportunityDescriptionsRepository =
        new OpportunityDescriptionsRepository();

      const createdOpportunity =
        await opportunityDescriptionsRepository.create(newOpportunity);

      if (createdOpportunity) {
        const itemsToProcess = selectedItems.filter(
          (si) =>
            si.item !== "" && si.quantity !== "" && parseInt(si.quantity) > 0
        );

        const opportunityItemsRepository = new OpportunityItemsRepository();

        for (let i = 0; i < itemsToProcess.length; i++) {
          const newOpportunityItem: OpportunityItemSupabase = {
            opportunity: createdOpportunity.id,
            item: parseInt(itemsToProcess[i].item),
            quantity: parseInt(itemsToProcess[i].quantity),
          };

          const createdOpportunityItem =
            await opportunityItemsRepository.create(newOpportunityItem);
          if (!createdOpportunityItem) {
            const idsToDelete = [createdOpportunity.id];
            await opportunityDescriptionsRepository.delete(idsToDelete);
            return;
          }
        }

        openSnackbar({
          open: true,
          message: "Opportunity Description added successfully.",
          variant: "alert",
          alert: {
            color: "success",
          },
        } as SnackbarProps);
      } else {
        openSnackbar({
          open: true,
          message:
            "Opportunity Description could not be added successfully. Please try again.",
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
          "Opportunity Description could not be added successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
    navigate("/opportunity-descriptions");
  }

  async function getItems() {
    setLoading(true);
    const itemsRepository = new ItemsRepository();
    const allItems = await itemsRepository.getWithoutFilters();
    if (allItems) {
      const { itemsData, itemsError } = allItems;
      if (itemsData && !itemsError) {
        setItems(itemsData);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getItems();
  }, []);

  return {
    validate,
    onSubmit,
    selectedItems,
    addSelectedItem,
    removeSelectedItem,
    handleChangeSelectedItem,
    loading,
    items,
  };
}
