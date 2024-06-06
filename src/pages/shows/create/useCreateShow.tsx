import { openSnackbar } from "api/snackbar";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import ShowsRepository, { ShowSupabase } from "utils/repositories/showsRepository";

export interface ValuesCreateShow {
  name: string;
  startDate: string;
  endDate: string;
  address: string;
  state: string;
  postCode: string;
}

export function useCreateShow() {
  const navigate = useNavigate();

  function validate(values: ValuesCreateShow) {
    const errors = {} as ValuesCreateShow;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    if (!values.startDate.trim()) {
      errors.startDate = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateShow) {
    try {
      const newShow: ShowSupabase = {
        name: values.name,
        start_date: values.startDate !== "" ? new Date(values.startDate) : null,
        end_date: values.endDate !== "" ? new Date(values.endDate) : null,
        address: values.address,
        state: values.state,
        post_code: values.postCode,
      };

      const showsRepository = new ShowsRepository();
      const createdShow = await showsRepository.create(newShow);

      if (createdShow) {
        openSnackbar({
          open: true,
          message: "Show added successfully.",
          variant: "alert",
          alert: {
            color: "success",
          },
        } as SnackbarProps);
      } else {
        openSnackbar({
          open: true,
          message:
            "Show could not be added successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      }

      navigate("/shows");
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Show could not be added successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      navigate("/shows");
    }
  }
  return { validate, onSubmit };
}
