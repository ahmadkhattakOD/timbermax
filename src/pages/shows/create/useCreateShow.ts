import { openSnackbar } from "api/snackbar";
import { useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { parseAddress } from "utils/helpers";
import ShowsRepository, {
  ShowSupabase,
} from "utils/repositories/showsRepository";

export interface ValuesCreateShow {
  name: string;
  startDate: string;
  endDate: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
  notes: string;
}

export function useCreateShow() {
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const navigate = useNavigate();

  function changeAddress(newValue: any, actionMeta: any) {
    let addressComponents = parseAddress(newValue?.value?.description ?? "");
    setSelectedSuburb(addressComponents.suburb);
    setSelectedState(addressComponents.state);
    setSelectedAddress(newValue?.value?.description ?? "");
  }

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
        address: selectedAddress,
        suburb: selectedSuburb,
        state: selectedState,
        post_code: values.postCode,
        notes: values.notes,
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
          message: "Show could not be added successfully. Please try again.",
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
  return {
    validate,
    onSubmit,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
  };
}
