import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import ShowsRepository, { ShowSupabase } from "utils/repositories/showsRepository";

export interface ValuesEditShow {
  name: string;
  startDate: string;
  endDate: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
}

export function useEditShow() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<any>(null);
  const { id } = useParams();

  function validate(values: ValuesEditShow) {
    const errors = {} as ValuesEditShow;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    if (!values.startDate.trim()) {
      errors.startDate = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditShow) {
    try {
      if (id && isNumeric(id)) {
        const updatedShow: ShowSupabase = {
          name: values.name,
          start_date: values.startDate !== "" ? new Date(values.startDate) : null,
          end_date: values.endDate !== "" ? new Date(values.endDate) : null,
          address: values.address,
          suburb: values.suburb,
          state: values.state,
          post_code: values.postCode,
        };

        const showsRepository = new ShowsRepository();
        const editedShow = await showsRepository.edit(
          parseInt(id),
          updatedShow
        );

        if (editedShow) {
          openSnackbar({
            open: true,
            message: "Show edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Show could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate("/shows");
      } else {
        openSnackbar({
          open: true,
          message:
            "Show could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);

        navigate("/shows");
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Show could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate("/shows");
    }
  }

  async function getShow() {
    setLoading(true);
    if (id && isNumeric(id)) {
      const showsRepository = new ShowsRepository();
      const existingShow = await showsRepository.getSingle(parseInt(id));
      if (existingShow) {
        const { showData, showError } = existingShow;
        if (showData && !showError) {
          setShow(showData);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getShow();
  }, []);

  return { validate, onSubmit, show, loading };
}
