import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric, parseAddress } from "utils/helpers";
import WarehousesRepository, {
  WarehouseSupabase,
} from "utils/repositories/warehousesRepository";

export interface ValuesEditWarehouse {
  name: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
}

export function useEditWarehouse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [warehouse, setWarehouse] = useState<any>(null);
  const { id } = useParams();
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  function changeAddress(newValue: any, actionMeta: any) {
    let addressComponents = parseAddress(newValue?.value?.description ?? "");
    setSelectedSuburb(addressComponents.suburb);
    setSelectedState(addressComponents.state);
    setSelectedAddress(newValue?.value?.description ?? "");
  }

  function validate(values: ValuesEditWarehouse) {
    const errors = {} as ValuesEditWarehouse;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditWarehouse) {
    try {
      if (id && isNumeric(id)) {
        const updatedWarehouse: WarehouseSupabase = {
          name: values.name,
          address: selectedAddress,
          suburb: selectedSuburb,
          state: selectedState,
          post_code: values.postCode,
        };

        const warehousesRepository = new WarehousesRepository();
        const editedWarehouse = await warehousesRepository.edit(
          parseInt(id),
          updatedWarehouse
        );

        if (editedWarehouse) {
          openSnackbar({
            open: true,
            message: "Warehouse edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Warehouse could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate("/warehouses");
      } else {
        openSnackbar({
          open: true,
          message:
            "Warehouse could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);

        navigate("/warehouses");
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Warehouse could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate("/warehouses");
    }
  }

  async function getWarehouse() {
    setLoading(true);
    if (id && isNumeric(id)) {
      const warehousesRepository = new WarehousesRepository();
      const existingWarehouse = await warehousesRepository.getSingle(
        parseInt(id)
      );
      if (existingWarehouse) {
        const { warehouseData, warehouseError } = existingWarehouse;
        if (warehouseData && !warehouseError) {
          setWarehouse(warehouseData);
          setSelectedAddress(warehouseData.address);
          setSelectedSuburb(warehouseData.suburb);
          setSelectedState(warehouseData.state);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getWarehouse();
  }, []);

  return {
    validate,
    onSubmit,
    warehouse,
    loading,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
  };
}
