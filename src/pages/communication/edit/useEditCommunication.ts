import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric, parseAddress } from "utils/helpers";
import CommunicationRepository, { CommunicationSupabase } from "utils/repositories/communicationRepository";
import WarehousesRepository, {
  WarehouseSupabase,
} from "utils/repositories/warehousesRepository";

export interface ValuesEditWarehouse {
  method: string;
  notes: string;
  date: string;
}

export function useEditCommunication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [communication, setCommunication] = useState<any>(null);
  const { id, iid } = useParams();

  function validate(values: ValuesEditWarehouse) {
    const errors = {} as ValuesEditWarehouse;

    if (!values.method.trim()) {
      errors.method = "required";
    }

    if (!values.date.trim()) {
      errors.date = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditWarehouse) {
    try {
      if (id && isNumeric(id) && iid && isNumeric((iid))) {
        const updatedCommunication: CommunicationSupabase = {
          customer: parseInt(id),
          method: values.method,
          date: values.date ? new Date(values.date) : null,
          notes: values.notes,
          files: [],
        };

        const communicationRepository = new CommunicationRepository();
        const editedCommunication = await communicationRepository.edit(
          parseInt(iid),
          updatedCommunication
        );

        if (editedCommunication) {
          openSnackbar({
            open: true,
            message: "Communication edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Communication could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate(`/customers/${id}/edit?tab=History`);
      } else {
        openSnackbar({
          open: true,
          message:
            "Communication could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);

        navigate(`/customers/${id}/edit?tab=History`);
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Communication could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate(`/customers/${id}/edit?tab=History`);
    }
  }

  async function getCommunication() {
    setLoading(true);
    if (iid && isNumeric(iid)) {
      const communicationRepository = new CommunicationRepository();
      const existingCommunication = await communicationRepository.getSingle(
        parseInt(iid)
      );
      if (existingCommunication) {
        const { communicationData, communicationError } = existingCommunication;
        if (communicationData && !communicationError) {
          setCommunication(communicationData);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getCommunication();
  }, []);

  return {
    validate,
    onSubmit,
    communication,
    loading,
  };
}
