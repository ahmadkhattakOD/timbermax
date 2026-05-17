import Box from "@mui/material/Box";
import CreateAndFiltersLayout from "components/CreateAndFiltersLayout";
import ActionButton from "components/ActionButton";
import { useStock } from "./useStock";
import DataTable from "components/data-table/DataTable";
import ModalDeleteConfirm from "components/ModalConfirmDelete";
import { getDateTimeFormatted, hasNonEmptyValue } from "utils/helpers";
import ModalFilters from "components/modal-filters/ModalFilters";
import { Form, Formik } from "formik";
import FormLayout from "components/FormLayout";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { CSVLink } from "react-csv";
import SearchInput from "components/SearchInput";
import StockReservationsModal from "components/stock-reservation-modal";

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
    getDataCsv,
    csvData,
    csvLink,
    searchValue,
    setSearchValue,
    handleSearchDebounced,
    goToStatus,
    reservationModalOpen,
    selectedItem,
    handleCloseReservationModal,
    historyModalOpen,
    selectedHistoryItem,
    handleCloseHistoryModal,
    StockHistoryModal: StockHistoryModalComponent,
  } = useStock();

  return (
    <Box sx={{ width: "100%" }}>
      <CreateAndFiltersLayout
        actionButton={
          <ActionButton text="Add New Stock" onClick={goToCreate} />
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
            <SearchInput
              placeholder="Search by item name or code"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                handleSearchDebounced(e);
              }}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <ActionButton text="Move Stock" onClick={goToMove} />
              {hasNonEmptyValue(filters) ? (
                <ActionButton
                  text="Reset Filters"
                  color="secondary"
                  onClick={resetFilters}
                />
              ) : null}
            </Box>
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
        onDownload={getDataCsv}
      />
      <ModalDeleteConfirm
        open={deleteConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onDelete={onDelete}
      />
      <ModalFilters
        title="Filter Stock"
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
                  submitButtonText="Apply"
                  inputs={[
                    <FormDropdown
                      key="item"
                      id={"item"}
                      name={"item"}
                      label="Item"
                      useFormattedStrings={false}
                      options={items.map((item) => {
                        return {
                          label: `${item.name} (${item.itemCode})`,
                          value: item.name,
                        };
                      })}
                    />,
                    <FormInput
                      key="category"
                      id={"category"}
                      name={"category"}
                      placeholder={"Category"}
                      label="Category"
                      type={"text"}
                    />,
                    <FormDropdown
                      key="warehouse"
                      id={"warehouse"}
                      name={"warehouse"}
                      label="Warehouse"
                      useFormattedStrings={false}
                      options={warehouses.map((warehouse) => {
                        return {
                          label: warehouse.name,
                          value: warehouse.id.toString(),
                        };
                      })}
                    />,
                    <FormDropdown
                      key="status"
                      id={"status"}
                      name={"status"}
                      label="Status"
                      options={[
                        { label: "Available", value: "available" },
                        { label: "On Hold", value: "on_hold" },
                        { label: "Committed", value: "committed" },
                        { label: "Damaged", value: "damaged" },
                      ]}
                    />,
                    <FormInput
                      key="minimumQuantity"
                      id={"minimumQuantity"}
                      name={"minimumQuantity"}
                      placeholder={"Minimum Quantity"}
                      label="Minimum Quantity"
                      type={"number"}
                    />,
                    <FormInput
                      key="maximumQuantity"
                      id={"maximumQuantity"}
                      name={"maximumQuantity"}
                      placeholder={"Maximum Quantity"}
                      label="Maximum Quantity"
                      type={"number"}
                    />,
                    <FormInput
                      key="updatedAtFrom"
                      id={"updatedAtFrom"}
                      name={"updatedAtFrom"}
                      placeholder={"Updated At From"}
                      label="Updated At From"
                      type={"date"}
                    />,
                    <FormInput
                      key="updatedAtTo"
                      id={"updatedAtTo"}
                      name={"updatedAtTo"}
                      placeholder={"Updated At To"}
                      label="Updated At To"
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
                    text="Cancel"
                  />
                  <ActionButton type="submit" text="Apply" />
                </Box>
              </Form>
            )}
          </Formik>
        }
      />
      <CSVLink
        data={csvData}
        headers={headCells.map((cell) => ({ label: cell.label, key: cell.id }))}
        filename={`stock_${getDateTimeFormatted()}.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />

      {/* Stock Reservations Modal */}
      {selectedItem && (
        <StockReservationsModal
          open={reservationModalOpen}
          onClose={handleCloseReservationModal}
          itemId={selectedItem.id}
          warehouseId={selectedItem.warehouseId}
          itemName={selectedItem.name}
          itemCode={selectedItem.code}
        />
      )}

      {/* Stock History Modal */}
      {selectedHistoryItem && (
        <StockHistoryModalComponent
          open={historyModalOpen}
          onClose={handleCloseHistoryModal}
          itemId={selectedHistoryItem.itemId}
          warehouseId={selectedHistoryItem.warehouseId}
          itemName={selectedHistoryItem.name}
        />
      )}
    </Box>
  );
}
