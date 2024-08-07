// project-imports
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useCreateCommunication } from "./useCreateCommunication";
import { Box, Button, styled, useTheme } from "@mui/material";
import { DocumentUpload, TagCross } from "iconsax-react";
import { acceptedFileTypes } from "utils/helpers";

// ==============================|| CREATE COMMUNICATION PAGE ||============================== //

export const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export default function CreateCommunication() {
  const { validate, onSubmit, selectedFiles, addFiles, removeFileFromIdx } =
    useCreateCommunication();

  const theme = useTheme();

  return (
    <Formik
      enableReinitialize
      initialValues={{
        method: "",
        date: "",
        notes: "",
      }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched, isSubmitting }) => (
        <Form onSubmit={handleSubmit}>
          <FormLayout
            isSubmitting={isSubmitting}
            submitButtonText={"add"}
            inputs={[
              <FormDropdown
                id={"method"}
                name={"method"}
                label={"method"}
                optional={false}
                options={[
                  "call",
                  "in-person-meeting",
                  "email",
                  "reminder",
                  "other",
                ]}
                error={touched.method ? errors.method : ""}
              />,
              <FormInput
                id={"date"}
                name={"date"}
                placeholder={"Date"}
                label={"date"}
                type={"date"}
                optional={false}
                error={touched.date ? errors.date : ""}
              />,
              <FormInput
                id={"notes"}
                name={"notes"}
                placeholder={"Notes"}
                label={"notes"}
                type={"text"}
                isTextArea
              />,
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "start",
                  gap: "1rem",
                  alignItems: "end",
                  height: "100%",
                }}
              >
                <Button
                  component="label"
                  role={undefined}
                  variant="contained"
                  tabIndex={-1}
                  startIcon={<DocumentUpload />}
                >
                  Attach Files
                  <VisuallyHiddenInput
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        addFiles(e.target.files);
                      }
                    }}
                    accept={acceptedFileTypes.toString()}
                  />
                </Button>
                {selectedFiles.map((file, idx) => {
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        backgroundColor: "secondary.light",
                        padding: "8px",
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        borderRadius: "8px",
                        gap: "8px",
                      }}
                    >
                      {file.name.length > 15
                        ? `${file.name.substring(0, 14)}...`
                        : file.name}
                      <TagCross
                        style={{
                          cursor: "pointer",
                          color: theme.palette.error.main,
                        }}
                        onClick={() => {
                          removeFileFromIdx(idx);
                        }}
                      />
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
