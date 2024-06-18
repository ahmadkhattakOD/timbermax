import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useSelectSale } from "./useSelectSale";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import ModalFilters from "components/modal-filters/ModalFilters";
import FormInput from "components/FormInput";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormDropdown from "components/FormDropdown";
import { Typography } from "@mui/material";

export default function SelectSale() {
  const {
    data,
    dataCount,
    loading,
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
  } = useSelectSale();

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <Typography>
            Select a sale to continue. Only sales with status not set as
            "Delivered" show up here.
          </Typography>
        }
      />
      <DataTable
        data={data}
        dataCount={dataCount}
        loading={loading}
        tableTitle="sales"
        selected={selected}
        setSelected={setSelected}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        page={page}
        setPage={setPage}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
        order={order}
        setOrder={setOrder}
        headCells={headCells}
        generateTableCells={generateTableCells}
        openDeleteConfirmModal={openDeleteConfirmModal}
        openFilterModal={openFilterModal}
        selectable={false}
        takeToOnClick="deliver"
      />
      <ModalDeleteConfirm
        open={deleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onDelete={onDelete}
      />
      <ModalFilters
        title="filter-sales"
        open={filterModalOpen}
        onClose={closeFilterModal}
        form={
          <Formik
            enableReinitialize
            initialValues={{}}
            validate={() => {}}
            onSubmit={() => {}}
          >
            {({ handleSubmit, errors, touched, isSubmitting, values }) => (
              <Form onSubmit={handleSubmit}>
                <FormLayout
                  isSubmitting={isSubmitting}
                  submitButtonText={"apply"}
                  inputs={[
                    <FormInput
                      id={"contactName"}
                      name={"contactName"}
                      placeholder={"Contact Name"}
                      label={"contact-name"}
                      type={"text"}
                      // error={touched.contactName ? errors.contactName : ""}
                    />,
                    <FormDropdown
                      id={"salesPerson"}
                      name={"salesPerson"}
                      label={"sales-person"}
                      useFormattedStrings={false}
                      options={[0, 1, 2, 3]}
                      // error={touched.salesPerson ? errors.salesPerson : ""}
                    />,
                    <FormInput
                      id={"depositMin"}
                      name={"depositMin"}
                      placeholder={"Minimum Deposit"}
                      label={"minimum-deposit"}
                      type={"number"}
                      min={0}
                      // error={touched.deposit ? errors.deposit : ""}
                    />,
                    <FormInput
                      id={"depositMax"}
                      name={"depositMax"}
                      placeholder={"Maximum Deposit"}
                      label={"maximum-deposit"}
                      type={"number"}
                      min={0}
                      // error={touched.deposit ? errors.deposit : ""}
                    />,
                    <FormInput
                      id={"totalMin"}
                      name={"totalMin"}
                      placeholder={"Minimum Total"}
                      label={"minimum-total"}
                      type={"number"}
                      min={0}
                      // error={touched.deposit ? errors.deposit : ""}
                    />,
                    <FormInput
                      id={"totalMax"}
                      name={"totalMax"}
                      placeholder={"Maximum Total"}
                      label={"maximum-total"}
                      type={"number"}
                      min={0}
                      // error={touched.deposit ? errors.deposit : ""}
                    />,
                  ]}
                  showSubmitButton={false}
                />
                <Box
                  display={"flex"}
                  justifyContent={"center"}
                  gap={"15px"}
                  marginTop={"2rem"}
                >
                  <ActionButton
                    onClick={closeFilterModal}
                    color={"secondary"}
                    text={"cancel"}
                  />
                  <ActionButton type="submit" text={"apply"} />
                </Box>
              </Form>
            )}
          </Formik>
        }
      />
    </Box>
  );
}
