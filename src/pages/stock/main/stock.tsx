import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useStock } from "./useStock";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import { hasNonEmptyValue } from "utils/helpers";
import ModalFilters from "components/modal-filters/ModalFilters";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";

export default function Stock() {
  const {
    data,
    dataCount,
    loading,
    goToCreate,
    goToMove,
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
    items,
    warehouses,
    resetFilters,
  } = useStock();

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <ActionButton text={"add-new-stock"} onClick={goToCreate} />
        }
        filters={
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              width: "100%",
              alignItems: "flex-end",
            }}
          >
            <ActionButton text={"move-stock"} onClick={goToMove} />
            {hasNonEmptyValue(filters) ? (
              <ActionButton
                text={"reset-filters"}
                color="secondary"
                onClick={resetFilters}
              />
            ) : (
              <></>
            )}
          </Box>
        }
      />
      <DataTable
        data={data}
        dataCount={dataCount}
        loading={loading}
        tableTitle="stock"
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
      />
      <ModalDeleteConfirm
        open={deleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onDelete={onDelete}
      />
      <ModalFilters
        title="filter-stock"
        open={filterModalOpen}
        onClose={closeFilterModal}
        form={
          <Formik
            enableReinitialize
            initialValues={filters}
            validate={validateFilters}
            onSubmit={handleFiltersSubmit}
          >
            {({ handleSubmit, errors, touched, isSubmitting, values }) => (
              <Form onSubmit={handleSubmit}>
                <FormLayout
                  isSubmitting={isSubmitting}
                  submitButtonText={"apply"}
                  inputs={[
                    <FormDropdown
                      id={"item"}
                      name={"item"}
                      label={"item"}
                      useFormattedStrings={false}
                      options={items.map((item) => {
                        return {
                          label: item.name,
                          value: item.id.toString(),
                        };
                      })}
                    />,
                    <FormDropdown
                      id={"warehouse"}
                      name={"warehouse"}
                      label={"warehouse"}
                      useFormattedStrings={false}
                      options={warehouses.map((warehouse) => {
                        return {
                          label: warehouse.name,
                          value: warehouse.id.toString(),
                        };
                      })}
                    />,
                    <FormInput
                      id={"minimumQuantity"}
                      name={"minimumQuantity"}
                      placeholder={"Minimum Quantity"}
                      label={"minimum-quantity"}
                      type={"number"}
                    />,
                    <FormInput
                      id={"maximumQuantity"}
                      name={"maximumQuantity"}
                      placeholder={"Maximum Quantity"}
                      label={"maximum-quantity"}
                      type={"number"}
                    />,
                    <FormInput
                      id={"updatedAtFrom"}
                      name={"updatedAtFrom"}
                      placeholder={"Updated At From"}
                      label={"updated-at-from"}
                      type={"date"}
                    />,
                    <FormInput
                      id={"updatedAtTo"}
                      name={"updatedAtTo"}
                      placeholder={"Updated At To"}
                      label={"updated-at-to"}
                      type={"date"}
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
