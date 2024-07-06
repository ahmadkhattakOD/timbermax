import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric, parseAddress } from "utils/helpers";
import ShowsRepository, {
  ShowSupabase,
} from "utils/repositories/showsRepository";

export interface ValuesEditShow {
  name: string;
  startDate: string;
  endDate: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
  notes: string;
}

export function useEditShow() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const { id } = useParams();

  function changeAddress(newValue: any, actionMeta: any) {
    let addressComponents = parseAddress(newValue?.value?.description ?? "");
    setSelectedSuburb(addressComponents.suburb);
    setSelectedState(addressComponents.state);
    setSelectedAddress(newValue?.value?.description ?? "");
  }

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
          start_date:
            values.startDate !== "" ? new Date(values.startDate) : null,
          end_date: values.endDate !== "" ? new Date(values.endDate) : null,
          address: selectedAddress,
          suburb: selectedSuburb,
          state: selectedState,
          post_code: values.postCode,
          notes: values.notes,
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
            message: "Show could not be edited successfully. Please try again.",
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
          message: "Show could not be edited successfully. Please try again.",
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
        message: "Show could not be edited successfully. Please try again.",
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
          setSelectedAddress(showData.address);
          setSelectedSuburb(showData.suburb);
          setSelectedState(showData.state);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getShow();
  }, []);

  return {
    validate,
    onSubmit,
    show,
    loading,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
  };
}
