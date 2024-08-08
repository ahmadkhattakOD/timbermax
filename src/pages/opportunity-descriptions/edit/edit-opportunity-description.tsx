// project-imports
import { Box, IconButton, Typography } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import CircularLoader from "components/CircularLoader";
import { useEditOpportunityDescription } from "./useEditOpportunityDescription";
import FormDropdown from "components/FormDropdown";
import { Add, Trash } from "iconsax-react";

// ==============================|| EDIT OPPORTUNITY DESCRIPTION PAGE ||============================== //

export default function EditOpportunityDescription() {
  const {
    validate,
    onSubmit,
    opportunityDescription,
    loading,
    selectedItems,
    addSelectedItem,
    removeSelectedItem,
    handleChangeSelectedItem,
    items,
  } = useEditOpportunityDescription();

  if (loading) {
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
    <Formik
      enableReinitialize
      initialValues={{
        name: opportunityDescription?.name ?? "",
        description: opportunityDescription?.description ?? "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting }) => (
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
                id={"description"}
                name={"description"}
                placeholder={"Description"}
                label={"description"}
                type={"text"}
              />,
              <Box
                {...{ fullWidth: true }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  alignItems: "start",
                  paddingTop: "2rem",
                }}
              >
                <Typography sx={{ paddingBottom: "2rem", fontSize: "16px" }}>
                  Select items and their quantities to link to this opportunity
                </Typography>
                {selectedItems.map((selectedItem, idx) => {
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "0.5rem",
                        alignItems: "flex-end",
                      }}
                    >
                      <FormDropdown
                        id={`item_${idx}`}
                        name={`item_${idx}`}
                        label={"item"}
                        useFormattedStrings={false}
                        options={items.map((item) => {
                          return {
                            label: item.name,
                            value: item.id.toString(),
                          };
                        })}
                        disabledValues={selectedItems.map((si) => si.item)}
                        value={selectedItem.item}
                        onChange={(e) => {
                          handleChangeSelectedItem("item", e.target.value, idx);
                        }}
                      />
                      <FormInput
                        id={`quantity_${idx}`}
                        name={`quantity_${idx}`}
                        placeholder={"Quantity"}
                        label={"quantity"}
                        type={"number"}
                        value={selectedItem.quantity}
                        onChange={(e) => {
                          handleChangeSelectedItem(
                            "quantity",
                            e.target.value,
                            idx
                          );
                        }}
                      />
                      {idx === selectedItems.length - 1 &&
                        selectedItem.item !== "" &&
                        selectedItem.quantity !== "" &&
                        selectedItems.length < items.length && (
                          <IconButton onClick={addSelectedItem}>
                            <Add />
                          </IconButton>
                        )}
                      {idx !== 0 && (
                        <IconButton
                          onClick={() => {
                            removeSelectedItem(idx);
                          }}
                        >
                          <Trash />
                        </IconButton>
                      )}
                    </Box>
                  );
                })}
              </Box>,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
