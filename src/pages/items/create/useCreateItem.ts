import { openSnackbar } from "api/snackbar";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import ItemsRepository, {
  ItemSupabase,
} from "utils/repositories/itemsRepository";
import { useEffect, useState } from "react";
import VendorsRepository from "utils/repositories/vendorsRepository";
import { useDebouncedSearch } from "utils/helpers";

export interface ValuesCreateItem {
  name: string;
  description: string;
  itemCode: string;
  sellPrice: string;
  purchasePrice: string;
  gst:boolean;
  vendorName: string;
  inlineVendorName: string;
}

export function useCreateItem() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState<string>("");
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [createInlineVendor, setCreateInlineVendor] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(undefined);
  const [inlineVendorName, setInlineVendorName] = useState("");
  const [vendorName, setVendorName] = useState<string>("");

  // Fetch vendors on mount
  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoadingVendors(true);
        const vendorsRepository = new VendorsRepository();
        const result = await vendorsRepository.get("name", true, 0, 49, 50, vendorSearch);

        if (result && result.vendorsData) {
          setVendors(result.vendorsData);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoadingVendors(false);
      }
    }

    fetchVendors();
  }, [vendorSearch]);

  // Debounced vendor search
  const handleVendorSearchDebounced = useDebouncedSearch(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVendorSearch(e.target.value);
    },
    500
  );

  function validate(values: ValuesCreateItem) {
    const errors = {} as ValuesCreateItem;

    // Validate vendor (either selected or inline)
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

    // For number fields, check if they're falsy (null, undefined, empty string)
    if (!values.sellPrice) {
      errors.sellPrice = "required";
    } else {
      // Now we know sellPrice has a value, but it might not be a string
      // Convert to string first
      const sellPriceStr = values.sellPrice.toString();
      const sellPriceNum = parseFloat(sellPriceStr);
      if (isNaN(sellPriceNum) || sellPriceNum < 0) {
        errors.sellPrice = "must be a valid number";
      }
    }

    if (!values.purchasePrice) {
      errors.purchasePrice = "required";
    } else {
      const purchasePriceStr = values.purchasePrice.toString();
      const purchasePriceNum = parseFloat(purchasePriceStr);
      if (isNaN(purchasePriceNum) || purchasePriceNum < 0) {
        errors.purchasePrice = "must be a valid number";
      }
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateItem) {
    try {
      let vendorId: number | undefined = undefined;

      // Handle inline vendor creation
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
            alert: {
              color: "error",
            },
          } as SnackbarProps);
          return;
        }
      } else if (selectedVendor) {
        vendorId = selectedVendor;
      }

      // Convert to numbers, handling any string representation
      const sellPriceNum = values.sellPrice ? parseFloat(values.sellPrice.toString()) : 0;
      const purchasePriceNum = values.purchasePrice ? parseFloat(values.purchasePrice.toString()) : 0;

      const newItem: ItemSupabase = {
        name: values.name,
        description: values.description,
        itemCode: values.itemCode,
        sellPrice: sellPriceNum,
        purchasePrice: purchasePriceNum,
        gst: values.gst || false,
        vendor_id: vendorId,
      };

      const itemsRepository = new ItemsRepository();
      const createdItem = await itemsRepository.create(newItem);

      if (createdItem) {
        openSnackbar({
          open: true,
          message: "Item added successfully.",
          variant: "alert",
          alert: {
            color: "success",
          },
        } as SnackbarProps);
      } else {
        openSnackbar({
          open: true,
          message: "Item could not be added successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      }

      // navigate("/items");
    } catch (e) {
      console.error("Error creating item:", e);
      openSnackbar({
        open: true,
        message: "Item could not be added successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      // navigate("/items");
    }
  }
  return {
    validate,
    onSubmit,
    vendors,
    loadingVendors,
    handleVendorSearchDebounced,
    createInlineVendor,
    setCreateInlineVendor,
    selectedVendor,
    setSelectedVendor,
    inlineVendorName,
    setInlineVendorName,
    vendorName,
    setVendorName,
  };
}