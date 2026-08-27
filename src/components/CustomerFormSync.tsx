import { useEffect, useRef } from "react";
import { useFormikContext } from "formik";

// ==============================|| CUSTOMER / ADDRESS → FORM SYNC ||============================== //
//
// Copies the selected customer (and its delivery address) into the form fields of
// the invoice/quotation forms.
//
// Both effects only fire when the selection genuinely changes — they are keyed on
// the customer id and on the address contents, not on the arrays that hold them.
// The customer list is refetched on every keystroke in the search box, so reacting
// to its identity used to re-apply the customer over anything already typed
// (contact details, one-time address) and reset the address mode.
//
// It is a real component so the hooks belong to a component of their own instead
// of being called inside Formik's render prop.

interface CustomerFormSyncProps {
  /** Id of the selected customer (undefined when nothing is selected). */
  selectedCustomer?: any;
  /** The customer row itself — the fields are read from here, not from the
   * dropdown's option list, which changes as the user searches. */
  selectedCustomerRecord?: any;
  createInlineCustomer?: boolean;
  customerAddresses: any[];
  selectedAddressIndex: number;
  /** True while a one-time address is being typed instead of a saved one. */
  customAddress: boolean;
  setCustomerName?: (name: string) => void;
  /** Called when the customer actually changes — used to leave custom-address mode. */
  onCustomerChange?: () => void;
  /** Fill the address fields from the customer record. Off for forms that keep
   * their own address snapshot and rely on the saved-address dropdown instead. */
  applyCustomerAddress?: boolean;
}

export default function CustomerFormSync({
  selectedCustomer,
  selectedCustomerRecord,
  createInlineCustomer = false,
  customerAddresses,
  selectedAddressIndex,
  customAddress,
  setCustomerName,
  onCustomerChange,
  applyCustomerAddress = false,
}: CustomerFormSyncProps) {
  // setValues (not repeated setFieldValue calls) so a customer lands in the form
  // as one update — no half-applied render where the name is in but the address
  // is not, and one validation pass instead of nine.
  const { setValues } = useFormikContext<any>();
  const appliedCustomerRef = useRef<any>(undefined);
  const appliedAddressRef = useRef<string | null>(null);

  // Typing a one-time address clears the applied-address marker so picking the
  // same saved address again re-fills the fields.
  useEffect(() => {
    if (customAddress) {
      appliedAddressRef.current = null;
    }
  }, [customAddress]);

  useEffect(() => {
    if (selectedCustomer) {
      const customer =
        selectedCustomerRecord?.id === selectedCustomer
          ? selectedCustomerRecord
          : null;
      // Wait for the record — never clear the form while it is still loading.
      if (!customer) return;
      if (appliedCustomerRef.current === selectedCustomer) return;

      appliedCustomerRef.current = selectedCustomer;
      onCustomerChange?.();
      setCustomerName?.(customer.name || "");
      setValues(
        (prev: any) => ({
          ...prev,
          contactName: customer.name || "",
          phone: customer.phone || "",
          mobile: customer.mobile || "",
          emailAddress: customer.email || "",
          ...(applyCustomerAddress
            ? {
                address: customer.address || "",
                suburb: customer.suburb || "",
                state: customer.state || "",
                postCode: customer.post_code || "",
              }
            : {}),
        }),
        true,
      );
      return;
    }

    // Nothing was ever applied (fresh form) — leave the fields alone.
    if (appliedCustomerRef.current === undefined) return;
    appliedCustomerRef.current = undefined;
    appliedAddressRef.current = null;
    if (createInlineCustomer) return;

    onCustomerChange?.();
    setCustomerName?.("");
    setValues(
      (prev: any) => ({
        ...prev,
        contactName: "",
        phone: "",
        mobile: "",
        emailAddress: "",
        address: "",
        suburb: "",
        state: "",
        postCode: "",
      }),
      false,
    );
  }, [
    selectedCustomer,
    selectedCustomerRecord,
    createInlineCustomer,
    applyCustomerAddress,
    setValues,
    setCustomerName,
    onCustomerChange,
  ]);

  // Populate the address fields from the chosen saved address.
  useEffect(() => {
    if (selectedAddressIndex < 0 || customerAddresses.length === 0) return;
    const address = customerAddresses[selectedAddressIndex];
    if (!address) return;

    const key = [
      selectedCustomer,
      selectedAddressIndex,
      address.address,
      address.suburb,
      address.state,
      address.post_code,
    ].join("|");
    // Same address as last time (the list was just refetched) — don't overwrite
    // anything the user has edited since.
    if (appliedAddressRef.current === key) return;
    appliedAddressRef.current = key;

    setValues(
      (prev: any) => ({
        ...prev,
        address: address.address || "",
        suburb: address.suburb || "",
        state: address.state || "",
        postCode: address.post_code || "",
      }),
      false,
    );
  }, [selectedCustomer, selectedAddressIndex, customerAddresses, setValues]);

  return null;
}
