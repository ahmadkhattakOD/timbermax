import { openSnackbar } from "api/snackbar";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import CommunicationRepository, {
  CommunicationSupabase,
} from "utils/repositories/communicationRepository";

export interface ValuesCreateCommunication {
  method: string;
  notes: string;
  date: string;
}

export function useCreateCommunication() {
  const navigate = useNavigate();

  const { id } = useParams();

  function validate(values: ValuesCreateCommunication) {
    const errors = {} as ValuesCreateCommunication;

    if (!values.method.trim()) {
      errors.method = "required";
    }

    if (!values.date.trim()) {
      errors.date = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateCommunication) {
    try {
      if (id && isNumeric(id)) {
        const newCommunication: CommunicationSupabase = {
          customer: parseInt(id),
          method: values.method,
          date: values.date ? new Date(values.date) : null,
          notes: values.notes,
          files: [],
        };

        const communicationRepository = new CommunicationRepository();
        const createdCommunication =
          await communicationRepository.create(newCommunication);

        if (createdCommunication) {
          openSnackbar({
            open: true,
            message: "Communication recorded successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Communication could not be recorded successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate(`/customers/${id}/edit?tab=History`);
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Communication could not be recorded successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      navigate(`/customers/${id}/edit?tab=History`);
    }
  }
  return {
    validate,
    onSubmit,
  };
}
