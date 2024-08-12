// project-imports
import { Box } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import CircularLoader from "components/CircularLoader";
import { australianStates } from "utils/helpers";
import { useEditItem } from "./useEditItem";

// ==============================|| EDIT WAREHOUSE PAGE ||============================== //

export default function EditItem() {
  const { validate, onSubmit, item, loading } = useEditItem();

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
        name: item.name ?? "",
        description: item.description ?? "",
        committed: item.committed ?? "",
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
              <FormInput
                id={"committed"}
                name={"committed"}
                placeholder={"Committed"}
                label={"committed"}
                type={"number"}
                error={touched.committed ? errors.committed : ""}
              />,
            ]}
          />
        </Form>
      )}
    </Formik>
  );
}
