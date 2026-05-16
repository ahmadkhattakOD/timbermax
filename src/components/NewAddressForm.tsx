import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  useTheme,
} from "@mui/material";
import PlacesInput from "components/PlacesInput";
import { australianStates } from "utils/helpers";

export interface NewAddressFormData {
  address: string;
  suburb: string;
  state: string;
  post_code: string;
  is_primary: boolean;
}

interface NewAddressFormProps {
  form: NewAddressFormData;
  onChange: (fn: (f: NewAddressFormData) => NewAddressFormData) => void;
  onAddressChange: (newValue: any, actionMeta: any) => void;
  onSave: () => void;
  saving: boolean;
  onCancel: () => void;
}

export default function NewAddressForm({
  form,
  onChange,
  onAddressChange,
  onSave,
  saving,
  onCancel,
}: NewAddressFormProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 2, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
      <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: "15px" }}>New Address</Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <PlacesInput
            id="new-address"
            name="new-address"
            placeholder="Address"
            label="Address"
            value={form.address}
            onChange={onAddressChange}
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth
            label="Suburb"
            size="small"
            value={form.suburb}
            onChange={(e) => onChange((f) => ({ ...f, suburb: e.target.value }))}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>State</InputLabel>
            <Select
              label="State"
              value={form.state}
              onChange={(e) => onChange((f) => ({ ...f, state: e.target.value }))}
            >
              {australianStates.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth
            label="Post Code"
            size="small"
            value={form.post_code}
            onChange={(e) => onChange((f) => ({ ...f, post_code: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_primary}
                onChange={(e) => onChange((f) => ({ ...f, is_primary: e.target.checked }))}
                size="small"
              />
            }
            label="Set as primary address"
          />
        </Grid>
      </Grid>
      <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
        <Button
          variant="contained"
          size="small"
          onClick={onSave}
          disabled={saving || !form.address.trim()}
        >
          {saving ? "Saving..." : "Save Address"}
        </Button>
        <Button variant="outlined" size="small" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
