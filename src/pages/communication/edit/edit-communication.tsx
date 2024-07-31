// project-imports
import { Box, Button, useTheme } from "@mui/material";
import FormLayout from "components/FormLayout";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import FormDropdown from "components/FormDropdown";
import { useEditCommunication } from "./useEditCommunication";
import CircularLoader from "components/CircularLoader";
import {
  acceptedFileTypes,
  cleanFileName,
  getDateFormattedForField,
} from "utils/helpers";
import PlacesInput from "components/PlacesInput";
import {
  BackSquare,
  Backward,
  BackwardItem,
  DocumentDownload,
  DocumentUpload,
  TagCross,
} from "iconsax-react";
import { VisuallyHiddenInput } from "../create/create-communication";

// ==============================|| EDIT COMMUNICATION PAGE ||============================== //

export default function EditCommunication() {
  const {
    validate,
    onSubmit,
    communication,
    loading,
    selectedFiles,
    existingAttachments,
    toDeleteAttachments,
    addFiles,
    removeFileFromIdx,
    downloadExistingFile,
    deleteExistingFile,
    restoreExistingFile,
    isDownloadingAttachment,
  } = useEditCommunication();

  const theme = useTheme();

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
        method: communication.method ?? "",
        date: communication.date
          ? getDateFormattedForField(communication.date)
          : "",
        notes: communication.notes ?? "",
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
              <FormDropdown
                id={"method"}
                name={"method"}
                label={"method"}
                optional={false}
                options={["call", "in-person-meeting", "email", "other"]}
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
                  width: "100%",
                  flexWrap: "wrap",
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
                {existingAttachments.map((url, idx) => {
                  let fileName = cleanFileName(url)?.split("/").pop();
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        backgroundColor: "secondary.light",
                        opacity: toDeleteAttachments.includes(idx) ? 0.3 : 1,
                        padding: "8px",
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        borderRadius: "8px",
                        gap: "8px",
                      }}
                    >
                      {fileName ?? `file_${idx}`}
                      {!toDeleteAttachments.includes(idx) && (
                        <DocumentDownload
                          style={{
                            cursor: isDownloadingAttachment ? "default" : "pointer",
                            color: isDownloadingAttachment
                              ? theme.palette.secondary.dark
                              : theme.palette.primary.main,
                          }}
                          onClick={() => {
                            if (!isDownloadingAttachment) {
                              downloadExistingFile(url);
                            }
                          }}
                        />
                      )}
                      {toDeleteAttachments.includes(idx) ? (
                        <BackSquare
                          style={{
                            cursor: "pointer",
                            color: theme.palette.error.main,
                          }}
                          onClick={() => {
                            restoreExistingFile(idx);
                          }}
                        />
                      ) : (
                        <TagCross
                          style={{
                            cursor: "pointer",
                            color: theme.palette.error.main,
                          }}
                          onClick={() => {
                            deleteExistingFile(idx);
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
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
