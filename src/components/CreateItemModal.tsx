import React, { useEffect, useState } from "react";
import { Form, Formik } from "formik";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import { X } from "lucide-react";
import FormInput from "components/FormInput";
import InputDropdown from "components/InputDropdown";
import { openSnackbar } from "api/snackbar";
import { SnackbarProps } from "types/snackbar";
import ItemsRepository, { ItemSupabase } from "utils/repositories/itemsRepository";
import VendorsRepository from "utils/repositories/vendorsRepository";
import { roundAmount, useDebouncedSearch } from "utils/helpers";

// Same field set / validation as the standalone Create Item page, packaged as a
// modal so a new item can be created without leaving the Create Invoice flow.
interface CreateItemModalValues {
  name: string;
  description: string;
  itemCode: string;
  sellPrice: string;
  purchasePrice: string;
  gst: boolean;
  vendorName: string;
  inlineVendorName: string;
}

interface CreateItemModalProps {
  open: boolean;
  onClose: () => void;
  // Called with the freshly created item row after a successful insert
  onCreated: (createdItem: any) => void | Promise<void>;
}

export default function CreateItemModal({ open, onClose, onCreated }: CreateItemModalProps) {
  const theme = useTheme();
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState<string>("");
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [createInlineVendor, setCreateInlineVendor] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(undefined);
  const [inlineVendorName, setInlineVendorName] = useState("");

  // Fetch vendors whenever the modal is open or the search term changes
  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      try {
        setLoadingVendors(true);
        const vendorsRepository = new VendorsRepository();
        const result = await vendorsRepository.get("name", true, 0, 49, 50, vendorSearch);
        if (active && result?.vendorsData) {
          setVendors(result.vendorsData);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        if (active) setLoadingVendors(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, vendorSearch]);

  const handleVendorSearchDebounced = useDebouncedSearch(
    (e: React.ChangeEvent<HTMLInputElement>) => setVendorSearch(e.target.value),
    500,
  );

  // Reset local vendor state each time the modal is freshly opened
  useEffect(() => {
    if (open) {
      setCreateInlineVendor(false);
      setSelectedVendor(undefined);
      setInlineVendorName("");
      setVendorSearch("");
    }
  }, [open]);

  function validate(values: CreateItemModalValues) {
    const errors = {} as CreateItemModalValues;

    if (!createInlineVendor && !selectedVendor) {
      errors.vendorName = "required";
    }
    if (createInlineVendor && !values.inlineVendorName.trim()) {
      errors.inlineVendorName = "required";
    }
    if (!values.name.trim()) {
      errors.name = "required";
    }
    if (!values.itemCode.trim()) {
      errors.itemCode = "required";
    }
    if (!values.sellPrice) {
      errors.sellPrice = "required";
    } else {
      const n = parseFloat(values.sellPrice.toString());
      if (isNaN(n) || n < 0) errors.sellPrice = "must be a valid number";
    }
    if (!values.purchasePrice) {
      errors.purchasePrice = "required";
    } else {
      const n = parseFloat(values.purchasePrice.toString());
      if (isNaN(n) || n < 0) errors.purchasePrice = "must be a valid number";
    }

    return errors;
  }

  async function onSubmit(values: CreateItemModalValues) {
    try {
      let vendorId: number | undefined = undefined;

      if (createInlineVendor && values.inlineVendorName.trim()) {
        const vendorsRepository = new VendorsRepository();
        const newVendor = await vendorsRepository.create({
          name: values.inlineVendorName.trim(),
        });
        if (newVendor && newVendor.id) {
          vendorId = newVendor.id;
        } else {
          openSnackbar({
            open: true,
            message: "Failed to create vendor. Please try again.",
            variant: "alert",
            alert: { color: "error" },
          } as SnackbarProps);
          return;
        }
      } else if (selectedVendor) {
        vendorId = selectedVendor;
      }

      const newItem: ItemSupabase = {
        name: values.name,
        description: values.description,
        itemCode: values.itemCode,
        sellPrice: roundAmount(values.sellPrice),
        purchasePrice: roundAmount(values.purchasePrice),
        gst: values.gst || false,
        vendor_id: vendorId,
      };

      const itemsRepository = new ItemsRepository();
      const createdItem = await itemsRepository.create(newItem);

      if (createdItem) {
        openSnackbar({
          open: true,
          message: `Item "${createdItem.name}" created and added to the invoice.`,
          variant: "alert",
          alert: { color: "success" },
        } as SnackbarProps);
        await onCreated(createdItem);
        onClose();
      } else {
        openSnackbar({
          open: true,
          message: "Item could not be created. Please try again.",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
      }
    } catch (e) {
      console.error("Error creating item:", e);
      openSnackbar({
        open: true,
        message: "Item could not be created. Please try again.",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Formik
        enableReinitialize
        initialValues={{
          name: "",
          description: "",
          itemCode: "",
          sellPrice: "",
          purchasePrice: "",
          gst: true,
          vendorName: "",
          inlineVendorName: inlineVendorName || "",
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ handleSubmit, errors, touched, isSubmitting, values, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" component="div">
                Create New Item
              </Typography>
              <IconButton onClick={onClose} size="small">
                <X size={20} />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {!createInlineVendor ? (
                    <InputDropdown
                      key="vendorName"
                      id="vendorName"
                      name="vendorName"
                      label="Vendor Name"
                      options={vendors}
                      value={vendors.find((v) => v.id === selectedVendor) || null}
                      secondaryLabel={
                        <Box
                          sx={{
                            color: theme.palette.primary.main,
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                          onClick={() => setCreateInlineVendor(true)}
                        >
                          Create New Vendor
                        </Box>
                      }
                      loading={loadingVendors}
                      optional={true}
                      onChange={handleVendorSearchDebounced}
                      onSelect={(e) => setSelectedVendor(e.target.value)}
                      error={errors.vendorName}
                    />
                  ) : (
                    <FormInput
                      key="inlineVendorName"
                      id="inlineVendorName"
                      name="inlineVendorName"
                      placeholder="Vendor Name"
                      label="Vendor Name"
                      type="text"
                      secondaryLabel={
                        <Box
                          sx={{
                            color: theme.palette.primary.main,
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                          onClick={() => {
                            setCreateInlineVendor(false);
                            setInlineVendorName("");
                            setFieldValue("inlineVendorName", "");
                          }}
                        >
                          Use Existing Vendor
                        </Box>
                      }
                      error={touched.inlineVendorName ? errors.inlineVendorName : ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFieldValue("inlineVendorName", e.target.value);
                        setInlineVendorName(e.target.value);
                      }}
                      value={values.inlineVendorName}
                    />
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormInput
                    id="name"
                    name="name"
                    placeholder="Item Specifications"
                    label="Item Specifications"
                    optional={false}
                    type="text"
                    error={touched.name ? errors.name : ""}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormInput
                    id="itemCode"
                    name="itemCode"
                    placeholder="Item Code"
                    label="Item Code"
                    optional={false}
                    type="text"
                    error={touched.itemCode ? errors.itemCode : ""}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      height: "100%",
                    }}
                  >
                    <FormInput
                      id="gst"
                      name="gst"
                      placeholder="GST"
                      secondaryLabel={null}
                      label="GST"
                      optional={true}
                      type="checkbox"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormInput
                    id="sellPrice"
                    name="sellPrice"
                    placeholder="Sell Price"
                    label="Sell Price (ex GST)"
                    optional={false}
                    type="number"
                    error={touched.sellPrice ? errors.sellPrice : ""}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormInput
                    id="purchasePrice"
                    name="purchasePrice"
                    placeholder="Purchase Price"
                    label="Purchase price (ex GST)"
                    optional={false}
                    type="number"
                    error={touched.purchasePrice ? errors.purchasePrice : ""}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormInput
                    id="description"
                    name="description"
                    placeholder="Description"
                    label="description"
                    type="text"
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={onClose} color="secondary" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create & Add"}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
