// project-imports
import { Box } from "@mui/material";
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

// ==============================|| EDIT CUSTOMER PAGE ||============================== //

export default function EditCustomer() {
  const {
    validate,
    onSubmit,
    customer,
    loadingInfo,
    changeAddress,
    selectedAddress,
    selectedSuburb,
    setSelectedSuburb,
    selectedState,
    setSelectedState,
    selectedTab,
    setSelectedTab,
    dataSales,
    dataCountSales,
    loadingSales,
    goToCreateSales,
    orderSales,
    setOrderSales,
    orderBySales,
    setOrderBySales,
    selectedSales,
    setSelectedSales,
    pageSales,
    setPageSales,
    rowsPerPageSales,
    setRowsPerPageSales,
    headCellsSales,
    generateTableCellsSales,
    onDeleteSales,
    deleteConfirmModalOpenSales,
    openDeleteConfirmModalSales,
    closeDeleteConfirmModalSales,
    filterModalOpenSales,
    openFilterModalSales,
    closeFilterModalSales,
    handleFiltersSubmitSales,
    validateFiltersSales,
    filtersSales,
    salesPersons,
    closers,
    shows,
    opportunities,
    resetFiltersSales,
    getDataCsvSales,
    csvDataSales,
    csvLinkSales,
    dataCommunication,
    dataCountCommunication,
    loadingCommunication,
    goToCreateCommunication,
    orderCommunication,
    setOrderCommunication,
    orderByCommunication,
    setOrderByCommunication,
    selectedCommunication,
    setSelectedCommunication,
    pageCommunication,
    setPageCommunication,
    rowsPerPageCommunication,
    setRowsPerPageCommunication,
    headCellsCommunication,
    generateTableCellsCommunication,
    onDeleteCommunication,
    deleteConfirmModalOpenCommunication,
    openDeleteConfirmModalCommunication,
    closeDeleteConfirmModalCommunication,
    filterModalOpenCommunication,
    openFilterModalCommunication,
    closeFilterModalCommunication,
    handleFiltersSubmitCommunication,
    validateFiltersCommunication,
    filtersCommunication,
    resetFiltersCommunication,
    getDataCsvCommunication,
    csvDataCommunication,
    csvLinkCommunication,
    setSearchParams,
  } = useEditCustomer();

  const navigate = useNavigate();
  return (
    <>
      <CreateAndFiltersLayout
        filters={
          <Box sx={{ display: "flex", gap: "1rem" }}>
            <ActionButton
              text={"Quotes"}
              onClick={() => {
                navigate(`/quotations/customer/${customer?.id}`);
              }}
            />
            <ActionButton
              text={"Invoices"}
              onClick={() => {
                navigate(`/invoices/customer/${customer?.id}`);
              }}
            />
          </Box>
        }
      />
      {selectedTab === "Information" && (
        <>
          {loadingInfo ? (
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
          ) : (
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
                address: customer.address ?? "",
                suburb: customer.suburb ?? "",
                state: customer.state ?? "",
                postCode: customer.post_code ?? "",
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
                        id={"name"}
                        name={"name"}
                        placeholder={"Name"}
                        label={"name"}
                        optional={false}
                        type={"text"}
                        error={touched.name ? errors.name : ""}
                      />,

                      <FormInput
                        id={"email"}
                        name={"email"}
                        placeholder={"Email"}
                        label={"email"}
                        type={"text"}
                        error={touched.email ? errors.email : ""}
                      />,
                      <FormInput
                        id={"phone"}
                        name={"phone"}
                        placeholder={"Phone"}
                        label={"phone"}
                        type={"text"}
                        error={touched.phone ? errors.phone : ""}
                      />,
                      <FormInput
                        id={"mobile"}
                        name={"mobile"}
                        placeholder={"Mobile"}
                        label={"mobile"}
                        type={"text"}
                        error={touched.mobile ? errors.mobile : ""}
                      />,
                      <PlacesInput
                        id="address"
                        name="address"
                        placeholder="Address"
                        onChange={changeAddress}
                        value={selectedAddress}
                        label="address"
                      />,
                      <FormInput
                        id={"suburb"}
                        name={"suburb"}
                        placeholder={"Suburb"}
                        label={"suburb"}
                        type={"text"}
                        value={selectedSuburb}
                        onChange={(e) => {
                          setSelectedSuburb(e.target.value);
                        }}
                      />,
                      <FormDropdown
                        id={"state"}
                        name={"state"}
                        label={"state"}
                        useFormattedStrings={false}
                        options={australianStates}
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                        }}
                      />,
                      <FormInput
                        id={"postCode"}
                        name={"postCode"}
                        placeholder={"Post Code"}
                        label={"post-code"}
                        type={"text"}
                      />,
                      <FormInput
                        id={"notes"}
                        name={"notes"}
                        placeholder={"Notes"}
                        label={"notes"}
                        type={"text"}
                        isTextArea
                      />,
                    ]}
                  />
                </Form>
              )}
            </Formik>
          )}
        </>
      )}
    </>
  );
}
