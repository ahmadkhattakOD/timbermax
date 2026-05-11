import {
  Checkbox,
  TableCell,
  Button,
  Typography,
  Box,
  Modal
} from "@mui/material";
import { openSnackbar } from "api/snackbar";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { initialRowsPerPage, useDebouncedSearch } from "utils/helpers";
import CustomersRepository from "utils/repositories/customersRepository";
import { CustomerAddress } from "utils/repositories/customersRepository";

const headCells: HeadCell[] = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "Name",
  },
  {
    id: "email",
    numeric: false,
    disablePadding: true,
    label: "Email",
  },
  {
    id: "phone",
    numeric: false,
    disablePadding: true,
    label: "Phone",
  },
  {
    id: "mobile",
    numeric: false,
    disablePadding: true,
    label: "Mobile",
  },
  {
    id: "address",
    numeric: false,
    disablePadding: true,
    label: "Primary Address",
  },
  {
    id: "other_addresses",
    numeric: false,
    disablePadding: true,
    label: "Other Addresses",
  },
  // {
  //   id: "suburb",
  //   numeric: false,
  //   disablePadding: true,
  //   label: "Suburb",
  // },
  // {
  //   id: "state",
  //   numeric: false,
  //   disablePadding: true,
  //   label: "State",
  // },
  // {
  //   id: "post_code",
  //   numeric: false,
  //   disablePadding: true,
  //   label: "Post Code",
  // },
  {
    id: "notes",
    numeric: false,
    disablePadding: true,
    label: "Notes",
  },
];

export interface ValuesFilterCustomers {
  name: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
}

const initialFilters: ValuesFilterCustomers = {
  name: "",
  email: "",
  phone: "",
  mobile: "",
  address: "",
  suburb: "",
  state: "",
  postCode: "",
};

export function useCustomers() {
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<ValuesFilterCustomers>(initialFilters);
  const [searchValue, setSearchValue] = useState("");
  const [csvData, setCsvData] = useState<string>("");
  const csvLink = useRef<any>();
  const navigate = useNavigate();

  // State for address modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedCustomerAddresses, setSelectedCustomerAddresses] = useState<
    CustomerAddress[]
  >([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");

  function goToCreate() {
    navigate("/customers/new");
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilters((prev) => ({ ...prev, name: e.target.value }));
  }

  const handleSearchDebounced = useDebouncedSearch(handleSearchChange);

  const openAddressModal = (
    addresses: CustomerAddress[],
    customerName: string,
  ) => {
    setSelectedCustomerAddresses(addresses);
    setSelectedCustomerName(customerName);
    setAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setAddressModalOpen(false);
    setSelectedCustomerAddresses([]);
    setSelectedCustomerName("");
  };

  function generateTableCells(
    row: any,
    labelId: string,
    isItemSelected: boolean,
  ) {
    // Get primary address
    const primaryAddress = row.addresses?.find(
      (addr: CustomerAddress) => addr.is_primary,
    ) ||
      row.addresses?.[0] || {
        address: row.address || "",
        suburb: row.suburb || "",
        state: row.state || "",
        post_code: row.post_code || "",
      };

    // Get other addresses (non-primary)
    const otherAddresses =
      row.addresses?.filter(
        (addr: CustomerAddress) =>
          !addr.is_primary &&
          (addr.address || addr.suburb || addr.state || addr.post_code),
      ) || [];

    const hasOtherAddresses = otherAddresses.length > 0;

    return (
      <React.Fragment>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={isItemSelected}
            inputProps={{
              "aria-labelledby": labelId,
            }}
          />
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.name}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.email}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.phone}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.mobile}</TableCell>

        {/* Primary Address */}
        <TableCell sx={{ minWidth: 250 }}>
          {primaryAddress.address ? (
            <Box>
              <Typography variant="body2">{primaryAddress.address}</Typography>
              <Typography variant="caption" color="textSecondary">
                {primaryAddress.suburb && `${primaryAddress.suburb}, `}
                {primaryAddress.state} {primaryAddress.post_code}
              </Typography>
              {primaryAddress.is_primary && (
                <Typography variant="caption" color="primary" display="block">
                  (Primary)
                </Typography>
              )}
            </Box>
          ) : (
            "-"
          )}
        </TableCell>

        {/* Other Addresses */}
        <TableCell sx={{ minWidth: 200 }}>
          {hasOtherAddresses ? (
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                openAddressModal(row.addresses, row.name);
              }}
            >
              {otherAddresses.length}{" "}
              {otherAddresses.length === 1 ? "address" : "addresses"}
            </Button>
          ) : (
            "-"
          )}
        </TableCell>
        {/* 
        <TableCell sx={{ minWidth: 200 }}>{primaryAddress.suburb}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{primaryAddress.state}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{primaryAddress.post_code}</TableCell> */}
        <TableCell sx={{ minWidth: 200 }}>{row.notes}</TableCell>
      </React.Fragment>
    );
  }

  function openDeleteConfirmModal() {
    setDeleteConfirmModalOpen(true);
  }

  async function onDelete() {
    const customersRepository = new CustomersRepository();
    const deletedCustomers = await customersRepository.delete(selected);
    if (deletedCustomers > 0) {
      openSnackbar({
        open: true,
        message: `${deletedCustomers} customer(s) deleted successfully.`,
        variant: "alert",
        alert: {
          color: "success",
        },
      } as SnackbarProps);
      setSelected([]);
      await getData();
    } else {
      openSnackbar({
        open: true,
        message:
          "Customer(s) could not be deleted successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
  }

  function closeDeleteConfirmModal() {
    setDeleteConfirmModalOpen(false);
  }

  function openFilterModal() {
    setFilterModalOpen(true);
  }

  function closeFilterModal() {
    setFilterModalOpen(false);
  }

  async function getData() {
    try {
      setLoading(true);
      const customersRepository = new CustomersRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const customers = await customersRepository.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage,
        filters,
      );
      if (customers) {
        const { customersData, customersCount, customersError } = customers;
        if (customersData && !customersError) {
          setData(customersData);
          setDataCount(customersCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching customers:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage, filters]);

  function getDataCsv() {
    try {
      let csvString = "";

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let customer = data[i] as any;

          // Get primary address
          const primaryAddress = customer.addresses?.find(
            (addr: CustomerAddress) => addr.is_primary,
          ) ||
            customer.addresses?.[0] || {
              address: customer.address || "",
              suburb: customer.suburb || "",
              state: customer.state || "",
              post_code: customer.post_code || "",
            };

          // Get all addresses for CSV
          const allAddresses =
            customer.addresses
              ?.map(
                (addr: CustomerAddress, index: number) =>
                  `${index + 1}. ${addr.address || ""}, ${addr.suburb || ""} ${addr.state || ""} ${addr.post_code || ""}${addr.is_primary ? " (Primary)" : ""}`,
              )
              .join("; ") ||
            `${primaryAddress.address || ""}, ${primaryAddress.suburb || ""} ${primaryAddress.state || ""} ${primaryAddress.post_code || ""}`;

          csvString += `${customer?.name ?? ""},${customer?.email ?? ""},${customer?.phone ?? ""},${customer?.mobile ?? ""},${allAddresses},${customer?.notes ?? ""}\n`;
        }

        setCsvData(csvString);

        setTimeout(() => {
          csvLink?.current?.link?.click();
        }, 2000);
      }
    } catch (e) {
      console.error("Error fetching customers:", e);
      setLoading(false);
    }
  }

  async function validateFilters(values: ValuesFilterCustomers) {
    const errors = {} as ValuesFilterCustomers;

    return errors;
  }

  async function handleFiltersSubmit(values: ValuesFilterCustomers) {
    try {
      setFilters(values);
      setFilterModalOpen(false);
    } catch (error) {
      console.error("Error filtering customers:", error);
    }
  }

  function resetFilters() {
    setSearchValue("");
    setFilters(initialFilters);
  }

  // Address Modal Component
  const AddressModal = () => (
    <Modal
      open={addressModalOpen}
      onClose={closeAddressModal}
      aria-labelledby="address-modal-title"
      aria-describedby="address-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          maxWidth: "90vw",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <Typography
          id="address-modal-title"
          variant="h6"
          component="h2"
          gutterBottom
        >
          Addresses for {selectedCustomerName}
        </Typography>

        <Box sx={{ mt: 2 }}>
          {selectedCustomerAddresses.map((address, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid",
                borderColor: address.is_primary ? "primary.main" : "grey.300",
                borderRadius: 1,
                bgcolor: address.is_primary ? "primary.light" : "transparent",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Address {index + 1}
                    {address.is_primary && (
                      <Typography
                        component="span"
                        color="primary"
                        sx={{ ml: 1 }}
                      >
                        (Primary)
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {address.address}
                  </Typography>
                  <Typography variant="body2">
                    {address.suburb && `${address.suburb}, `}
                    {address.state} {address.post_code}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={closeAddressModal} variant="outlined">
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );

  return {
    data,
    dataCount,
    loading,
    goToCreate,
    order,
    setOrder,
    orderBy,
    setOrderBy,
    selected,
    setSelected,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    headCells,
    generateTableCells,
    onDelete,
    deleteConfirmModalOpen,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    filterModalOpen,
    openFilterModal,
    closeFilterModal,
    handleFiltersSubmit,
    validateFilters,
    filters,
    resetFilters,
    getDataCsv,
    csvData,
    csvLink,
    handleSearchDebounced,
    searchValue,
    setSearchValue,
    AddressModal,
    addressModalOpen,
    selectedCustomerAddresses,
    selectedCustomerName,
  };
}
