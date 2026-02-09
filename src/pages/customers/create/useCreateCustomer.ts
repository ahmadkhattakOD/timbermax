import { openSnackbar } from "api/snackbar";
import { useState } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import CustomersRepository, {
  CustomerSupabase,
  CustomerAddress,
} from "utils/repositories/customersRepository";

export interface ValuesCreateCustomer {
  name: string;
  email: string;
  phone: string;
  mobile: string;
  notes: string;
}

export function useCreateCustomer() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([{
    address: "",
    suburb: "",
    state: "",
    post_code: "",
    is_primary: true,
  }]);
  const navigate = useNavigate();

  function validate(values: ValuesCreateCustomer) {
    const errors: any = {};

    if (!values.name.trim()) {
      errors.name = "required";
    }

    // Validate addresses if needed
    if (addresses.length === 0) {
      errors.addresses = "At least one address is required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateCustomer, formikActions?: any, currentAddresses?: CustomerAddress[]) {
    try {
      const addressesToSave = currentAddresses || addresses;
      
      // Filter out empty addresses
      const filteredAddresses = addressesToSave.filter(addr => 
        addr.address.trim() || addr.suburb.trim() || addr.state.trim() || addr.post_code.trim()
      );

      const newCustomer: CustomerSupabase = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        mobile: values.mobile,
        addresses: filteredAddresses,
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
    } finally {
      if (formikActions) {
        formikActions.setSubmitting(false);
      }
    }
  }
  
  return {
    validate,
    onSubmit,
    addresses,
    setAddresses,
  };
}