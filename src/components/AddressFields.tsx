import { Grid } from "@mui/material";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import PlacesInput from "components/PlacesInput";
import { australianStates } from "utils/helpers";

// ==============================|| SHARED ADDRESS FIELDS ||============================== //
//
// Renders the 4 delivery-address inputs (address / suburb / state / post code)
// as Grid items. The caller supplies the surrounding <Grid container>, so the
// items slot in exactly where the inline JSX used to live.
//
// IMPORTANT: this is a real module-scope component (stable identity). Do NOT
// redefine it inside a render body — doing so gives it a new type every render
// and remounts PlacesInput, wiping the open suggestions menu and typed text
// (the Vercel "flicker" bug).
//
// `variant` only switches the Grid breakpoints so each page keeps its exact
// pre-refactor layout:
//   - "invoice"  : address xs12, suburb xs12/sm5, state xs6/sm4, postCode xs6/sm3
//   - "document" : address xs12/md6, suburb+state+postCode each xs12/sm6/md3

interface AddressValues {
  address: string;
  suburb: string;
  state: string;
  postCode: string;
}

interface AddressFieldsProps {
  values: AddressValues;
  setFieldValue: (field: string, value: any) => void;
  changeAddress: (newValue: any, actionMeta: any, setFieldValue: any) => void;
  variant?: "invoice" | "document";
}

const GRID = {
  invoice: {
    address: { xs: 12 },
    suburb: { xs: 12, sm: 5 },
    state: { xs: 6, sm: 4 },
    postCode: { xs: 6, sm: 3 },
  },
  document: {
    address: { xs: 12, md: 6 },
    suburb: { xs: 12, sm: 6, md: 3 },
    state: { xs: 12, sm: 6, md: 3 },
    postCode: { xs: 12, sm: 6, md: 3 },
  },
} as const;

const AddressFields = ({
  values,
  setFieldValue,
  changeAddress,
  variant = "document",
}: AddressFieldsProps) => {
  const g = GRID[variant];

  return (
    <>
      <Grid item {...g.address}>
        <PlacesInput
          key="address"
          id="address"
          name="address"
          placeholder="Address"
          onChange={(newValue, actionMeta) => {
            setFieldValue("address", newValue?.value?.description ?? "");
            changeAddress(newValue, actionMeta, setFieldValue);
          }}
          value={values.address}
          label="Address"
        />
      </Grid>

      <Grid item {...g.suburb}>
        <FormInput
          key="suburb"
          id="suburb"
          name="suburb"
          placeholder="Suburb"
          label="Suburb"
          type="text"
          value={values.suburb}
          onChange={(e) => setFieldValue("suburb", e.target.value)}
        />
      </Grid>

      <Grid item {...g.state}>
        <FormDropdown
          key="state"
          id="state"
          name="state"
          label="State"
          useFormattedStrings={false}
          options={australianStates.map((state) => ({
            label: state,
            value: state,
          }))}
          value={values.state}
          onChange={(e) => setFieldValue("state", e.target.value)}
        />
      </Grid>

      <Grid item {...g.postCode}>
        <FormInput
          key="postCode"
          id="postCode"
          name="postCode"
          placeholder="Post Code"
          label="Post Code"
          type="text"
          value={values.postCode}
          onChange={(e) => setFieldValue("postCode", e.target.value)}
        />
      </Grid>
    </>
  );
};

export default AddressFields;
