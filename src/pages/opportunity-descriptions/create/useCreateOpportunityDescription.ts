import { openSnackbar } from "api/snackbar";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import ItemsRepository, {
  ItemSupabase,
} from "utils/repositories/itemsRepository";
import OpportunityDescriptionsRepository, { OpportunityDescriptionSupabase } from "utils/repositories/opportunityDescriptionsRepository";

export interface ValuesCreateOpportunityDescription {
  name: string;
  description: string;
}

export function useCreateOpportunityDescription() {
  const navigate = useNavigate();

  function validate(values: ValuesCreateOpportunityDescription) {
    const errors = {} as ValuesCreateOpportunityDescription;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateOpportunityDescription) {
    try {
      const newItem: OpportunityDescriptionSupabase = {
        name: values.name,
        description: values.description,
      };

      const opportunityDescriptionsRepository = new OpportunityDescriptionsRepository();
      const createdOpportunity = await opportunityDescriptionsRepository.create(newItem);

      if (createdOpportunity) {
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
          message: "Opportunity Description could not be added successfully. Please try again.",
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
        message: "Opportunity Description could not be added successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
    navigate("/opportunity-descriptions");
  }
  return { validate, onSubmit };
}
