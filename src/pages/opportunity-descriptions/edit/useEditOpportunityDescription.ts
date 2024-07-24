import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import ItemsRepository, {
  ItemSupabase,
} from "utils/repositories/itemsRepository";
import OpportunityDescriptionsRepository, {
  OpportunityDescriptionSupabase,
} from "utils/repositories/opportunityDescriptionsRepository";

export interface ValuesEditOpportunityDescription {
  name: string;
  description: string;
}

export function useEditOpportunityDescription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [opportunityDescription, setOpportunityDescription] =
    useState<any>(null);
  const { id } = useParams();

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
      const opportunityDescriptionsRepository = new OpportunityDescriptionsRepository();
      const existingOpportunity = await opportunityDescriptionsRepository.getSingle(parseInt(id));
      if (existingOpportunity) {
        const { opportunityData, opportunityError } = existingOpportunity;
        if (opportunityData && !opportunityError) {
          setOpportunityDescription(opportunityData);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getOpportunityDescription();
  }, []);

  return { validate, onSubmit, opportunityDescription, loading };
}
