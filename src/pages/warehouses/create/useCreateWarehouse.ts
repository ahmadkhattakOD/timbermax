import { openSnackbar } from "api/snackbar";
import { useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { parseAddress } from "utils/helpers";
import WarehousesRepository, {
  WarehouseSupabase,
} from "utils/repositories/warehousesRepository";

export interface ValuesCreateWarehouse {
  name: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
}

export function useCreateWarehouse() {
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

  function validate(values: ValuesCreateWarehouse) {
    const errors = {} as ValuesCreateWarehouse;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateWarehouse) {
    try {
      const newWarehouse: WarehouseSupabase = {
        name: values.name,
        address: selectedAddress,
        suburb: selectedSuburb,
        state: selectedState,
        post_code: values.postCode,
      };

      const warehousesRepository = new WarehousesRepository();
      const createdWarehouse = await warehousesRepository.create(newWarehouse);

      if (createdWarehouse) {
        openSnackbar({
          open: true,
          message: "Warehouse added successfully.",
          variant: "alert",
          alert: {
            color: "success",
          },
        } as SnackbarProps);
      } else {
        openSnackbar({
          open: true,
          message:
            "Warehouse could not be added successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      }

      navigate("/warehouses");
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Warehouse could not be added successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      navigate("/warehouses");
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
