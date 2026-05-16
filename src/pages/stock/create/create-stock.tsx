// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import InputDropdown from "components/InputDropdown";
import { useCreateStock } from "./useCreateStock";

// ==============================|| CREATE STOCK PAGE ||============================== //

export default function CreateStock() {
  const {
    items,
    warehouses,
    loadingItems,
    loadingWarehouses,
    selectedItem,
    setSelectedItem,
    selectedWarehouse,
    setSelectedWarehouse,
    handleItemSearchDebounced,
    handleWarehouseSearchDebounced,
    validate,
    onSubmit,
  } = useCreateStock();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        item: "",
        warehouse: "",
        quantity: "",
        notes: "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting, setFieldValue }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"add"}
            inputs={[
              <InputDropdown
                id={"item"}
                name={"item"}
                label={"item"}
                optional={false}
                options={items.map((item) => ({ id: item.id, name: item.name }))}
                value={selectedItem ? { id: selectedItem.id, name: selectedItem.name } : null}
                loading={loadingItems}
                onChange={handleItemSearchDebounced}
                onSelect={(e) => {
                  const id = e.target.value;
                  setSelectedItem(id ? items.find((i) => i.id == id) || null : null);
                  setFieldValue("item", id ? id.toString() : "");
                }}
                error={touched.item ? errors.item : ""}
              />,
              <InputDropdown
                id={"warehouse"}
                name={"warehouse"}
                label={"warehouse"}
                optional={false}
                options={warehouses.map((w) => ({ id: w.id, name: w.name }))}
                value={selectedWarehouse ? { id: selectedWarehouse.id, name: selectedWarehouse.name } : null}
                loading={loadingWarehouses}
                onChange={handleWarehouseSearchDebounced}
                onSelect={(e) => {
                  const id = e.target.value;
                  setSelectedWarehouse(id ? warehouses.find((w) => w.id == id) || null : null);
                  setFieldValue("warehouse", id ? id.toString() : "");
                }}
                error={touched.warehouse ? errors.warehouse : ""}
              />,
              <FormInput
                id={"quantity"}
                name={"quantity"}
                placeholder={"Quantity"}
                label={"quantity"}
                type={"number"}
                optional={false}
                error={touched.quantity ? errors.quantity : ""}
              />,
              <FormInput
                id={"notes"}
                name={"notes"}
                placeholder={"Notes (e.g., Purchase Order #12345)"}
                label={"notes"}
                type={"text"}
                optional={true}
                error={touched.notes ? errors.notes : ""}
              />,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
