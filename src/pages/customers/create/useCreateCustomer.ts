import { openSnackbar } from "api/snackbar";
import { useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { parseAddress } from "utils/helpers";
import CustomersRepository, {
  CustomerSupabase,
} from "utils/repositories/customersRepository";

export interface ValuesCreateCustomer {
  name: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
  lostReason: string;
  notes: string;
}

export function useCreateCustomer() {
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

  function validate(values: ValuesCreateCustomer) {
    const errors = {} as ValuesCreateCustomer;

    if (!values.name.trim()) {
      errors.name = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateCustomer) {
    try {
      const newCustomer: CustomerSupabase = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        mobile: values.mobile,
        address: selectedAddress,
        suburb: selectedSuburb,
        state: selectedState,
        post_code: values.postCode,
        notes: values.notes,
      };

      const customersRepository = new CustomersRepository();
      const createdCustomer = await customersRepository.create(newCustomer);

      if (createdCustomer) {
        openSnackbar({
          open: true,
          message: "Customer added successfully.",
          variant: "alert",
          alert: {
            color: "success",
          },
        } as SnackbarProps);
      } else {
        openSnackbar({
          open: true,
          message:
            "Customer could not be added successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      }

      navigate("/customers");
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Customer could not be added successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      navigate("/customers");
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
