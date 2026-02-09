// project-imports
import { Box, IconButton, Button, Typography } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditCustomer } from "./useEditCustomer";
import CircularLoader from "components/CircularLoader";
import { australianStates, getDateFormattedForField } from "utils/helpers";
import PlacesInput from "components/PlacesInput";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useNavigate } from "react-router";
import { Add, Delete, LocationOn } from "@mui/icons-material";
import { useState, useEffect } from "react"; // Add useEffect

// ==============================|| EDIT CUSTOMER PAGE ||============================== //

export default function EditCustomer() {
  const {
    validate,
    onSubmit,
    customer,
    loadingInfo,
    addresses,
    setAddresses,
    selectedTab,
    setSelectedTab,
  } = useEditCustomer();

  const [activeAddressIndex, setActiveAddressIndex] = useState(0);
  const navigate = useNavigate();

  // Reset active address index when addresses change
  useEffect(() => {
    if (addresses.length > 0 && activeAddressIndex >= addresses.length) {
      setActiveAddressIndex(addresses.length - 1);
    }
  }, [addresses, activeAddressIndex]);

  const handleAddAddress = () => {
    const newAddress = {
      address: "",
      suburb: "",
      state: "",
      post_code: "",
      is_primary: addresses.length === 0, // First address is primary by default
    };
    setAddresses([...addresses, newAddress]);
    setActiveAddressIndex(addresses.length);
  };

  const handleRemoveAddress = (index: number) => {
    if (addresses.length <= 1) return;
    
    const newAddresses = addresses.filter((_, i) => i !== index);
    
    // If we're removing the primary address and there are other addresses,
    // make the first one primary
    if (addresses[index].is_primary && newAddresses.length > 0) {
      newAddresses[0].is_primary = true;
    }
    
    setAddresses(newAddresses);
    
    // Update active index
    if (index >= newAddresses.length) {
      setActiveAddressIndex(newAddresses.length - 1);
    }
  };

  const handleSetPrimaryAddress = (index: number) => {
    const newAddresses = addresses.map((addr, i) => ({
      ...addr,
      is_primary: i === index,
    }));
    setAddresses(newAddresses);
  };

  const handleAddressFieldChange = (index: number, field: string, value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index] = {
      ...newAddresses[index],
      [field]: value,
    };
    setAddresses(newAddresses);
  };

  const handlePlacesInputChange = (index: number, newValue: any) => {
    // Simple parsing function for PlacesInput
    const parseSimpleAddress = (fullAddress: string) => {
      if (!fullAddress) {
        return { suburb: '', state: '', postCode: '' };
      }
      
      const parts = fullAddress.split(',').map(part => part.trim());
      const result = { suburb: '', state: '', postCode: '' };
      
      if (parts.length >= 2) {
        result.suburb = parts[1];
      }
      
      // Try to extract state and postcode from the last part
      if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1];
        const lastParts = lastPart.split(' ');
        if (lastParts.length >= 2) {
          result.state = lastParts[0];
          result.postCode = lastParts[1];
        }
      }
      
      return result;
    };

    const newAddresses = [...addresses];
    const addressComponents = parseSimpleAddress(newValue?.value?.description ?? "");
    
    newAddresses[index] = {
      ...newAddresses[index],
      address: newValue?.value?.description ?? "",
      suburb: addressComponents.suburb,
      state: addressComponents.state,
      post_code: addressComponents.postCode,
    };
    
    setAddresses(newAddresses);
  };

  // Handle case where customer is not loaded yet
  if (!customer && loadingInfo) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularLoader />
      </Box>
    );
  }

  return (
    <>
      <CreateAndFiltersLayout
        filters={
          <Box sx={{ display: "flex", gap: "1rem" }}>
            <ActionButton
              text={"Quotes"}
              onClick={() => {
                if (customer?.id) {
                  navigate(`/quotations/customer/${customer.id}`);
                }
              }}
            />
            <ActionButton
              text={"Invoices"}
              onClick={() => {
                if (customer?.id) {
                  navigate(`/invoices/customer/${customer.id}`);
                }
              }}
            />
          </Box>
        }
      />
      {selectedTab === "Information" && customer && (
        <Formik
          enableReinitialize
          initialValues={{
            name: customer.name ?? "",
            milestone: customer.milestone ?? "",
            expectedCloseDate: customer.expected_close_date
              ? getDateFormattedForField(customer.expected_close_date)
              : "",
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            mobile: customer.mobile ?? "",
            lostReason: customer.lost_reason ?? "",
            notes: customer.notes ?? "",
          }}
          validate={validate}
          onSubmit={onSubmit}
        >
          {({ handleSubmit, errors, touched, isSubmitting, values }) => (
            <Form onSubmit={handleSubmit}>
              <FormLayout
                isSubmitting={isSubmitting}
                submitButtonText={"submit"}
                inputs={[
                  <FormInput
                    key="name"
                    id={"name"}
                    name={"name"}
                    placeholder={"Name"}
                    label={"name"}
                    optional={false}
                    type={"text"}
                    error={touched.name ? errors.name : ""}
                  />,

                  <FormInput
                    key="email"
                    id={"email"}
                    name={"email"}
                    placeholder={"Email"}
                    label={"email"}
                    type={"text"}
                    error={touched.email ? errors.email : ""}
                  />,
                  <FormInput
                    key="phone"
                    id={"phone"}
                    name={"phone"}
                    placeholder={"Phone"}
                    label={"phone"}
                    type={"text"}
                    error={touched.phone ? errors.phone : ""}
                  />,
                  <FormInput
                    key="mobile"
                    id={"mobile"}
                    name={"mobile"}
                    placeholder={"Mobile"}
                    label={"mobile"}
                    type={"text"}
                    error={touched.mobile ? errors.mobile : ""}
                  />,
                  
                  <Box key="address-section" sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Addresses</Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={handleAddAddress}
                        size="small"
                      >
                        Add Address
                      </Button>
                    </Box>
                    
                    {/* Address Tabs */}
                    {addresses.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {addresses.map((addr, index) => (
                          <Box
                            key={`address-tab-${index}`}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 1,
                              border: `2px solid ${activeAddressIndex === index ? 'primary.main' : 'grey.300'}`,
                              borderRadius: 1,
                              cursor: 'pointer',
                              bgcolor: activeAddressIndex === index ? 'primary.light' : 'transparent',
                              '&:hover': {
                                bgcolor: 'grey.100',
                              },
                            }}
                            onClick={() => setActiveAddressIndex(index)}
                          >
                            <LocationOn color={addr.is_primary ? "primary" : "action"} />
                            <Typography variant="body2">
                              {addr.address ? `Address ${index + 1}` : 'New Address'}
                              {addr.is_primary && ' (Primary)'}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAddress(index);
                              }}
                              disabled={addresses.length <= 1}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {/* Address Form */}
                    {addresses.length > 0 && (
                      <Box sx={{ p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">
                            Address {activeAddressIndex + 1}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleSetPrimaryAddress(activeAddressIndex)}
                            disabled={addresses[activeAddressIndex]?.is_primary}
                          >
                            Set as Primary
                          </Button>
                        </Box>
                        
                        <PlacesInput
                          id={`address-${activeAddressIndex}`}
                          name={`address-${activeAddressIndex}`}
                          placeholder="Address"
                          onChange={(newValue) => handlePlacesInputChange(activeAddressIndex, newValue)}
                          value={addresses[activeAddressIndex]?.address || ""}
                          label="address"
                        />
                        
                        <FormInput
                          id={`suburb-${activeAddressIndex}`}
                          name={`suburb-${activeAddressIndex}`}
                          placeholder={"Suburb"}
                          label={"suburb"}
                          type={"text"}
                          value={addresses[activeAddressIndex]?.suburb || ""}
                          onChange={(e) => handleAddressFieldChange(activeAddressIndex, 'suburb', e.target.value)}
                        />
                        
                        <FormDropdown
                          id={`state-${activeAddressIndex}`}
                          name={`state-${activeAddressIndex}`}
                          label={"state"}
                          useFormattedStrings={false}
                          options={australianStates}
                          value={addresses[activeAddressIndex]?.state || ""}
                          onChange={(e) => handleAddressFieldChange(activeAddressIndex, 'state', e.target.value)}
                        />
                        
                        <FormInput
                          id={`postCode-${activeAddressIndex}`}
                          name={`postCode-${activeAddressIndex}`}
                          placeholder={"Post Code"}
                          label={"post-code"}
                          type={"text"}
                          value={addresses[activeAddressIndex]?.post_code || ""}
                          onChange={(e) => handleAddressFieldChange(activeAddressIndex, 'post_code', e.target.value)}
                        />
                      </Box>
                    )}
                    
                    {addresses.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4, border: 2, borderStyle: 'dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                        <Typography color="textSecondary" gutterBottom>
                          No addresses added yet
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={handleAddAddress}
                        >
                          Add First Address
                        </Button>
                      </Box>
                    )}
                  </Box>,
                  
                  <FormInput
                    key="notes"
                    id={"notes"}
                    name={"notes"}
                    placeholder={"Notes"}
                    label={"notes"}
                    type={"text"}
                    isTextArea
                    defaultValue={customer.notes || ""}
                  />,
                ]}
              />
            </Form>
          )}
        </Formik>
      )}
    </>
  );
}