import { openSnackbar } from "api/snackbar";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { acceptedFileTypes, confirmFileSize, isNumeric } from "utils/helpers";
import CommunicationRepository, {
  CommunicationSupabase,
} from "utils/repositories/communicationRepository";

export interface ValuesCreateCommunication {
  method: string;
  notes: string;
  date: string;
}

export function useCreateCommunication() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const navigate = useNavigate();
  const { id } = useParams();

  function addFiles(files: FileList) {
    let filesToAdd: File[] = [];
    for (let i = 0; i < files.length; i++) {
      if (!confirmFileSize(files[i])) {
        openSnackbar({
          open: true,
          message: `File ${files[i].name} exceeds the 5 MB file size limit.`,
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);
      } else {
        if (files[i].name.split('.').length > 1) {
          const extension = files[i].name.split('.').pop();
          if (!acceptedFileTypes.includes(`.${extension}`)) {
            openSnackbar({
              open: true,
              message: `File ${files[i].name} has a format that is not allowed.`,
              variant: "alert",
              alert: {
                color: "error",
              },
            } as SnackbarProps);
          } else {
            filesToAdd.push(files[i]);
          }
        }
      }
    }
    setSelectedFiles((selectedFiles) => [...selectedFiles, ...filesToAdd]);
  }

  function removeFileFromIdx(idx: number) {
    const temp = [...selectedFiles];
    temp.splice(idx, 1);
    setSelectedFiles(temp);
  }

  function validate(values: ValuesCreateCommunication) {
    const errors = {} as ValuesCreateCommunication;

    if (!values.method.trim()) {
      errors.method = "required";
    }

    if (!values.date.trim()) {
      errors.date = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesCreateCommunication) {
    try {
      if (id && isNumeric(id)) {
        const communicationRepository = new CommunicationRepository();
        const publicUrls =
          await communicationRepository.uploadAttachmentsAndReturnUrls(
            selectedFiles
          );

        const newCommunication: CommunicationSupabase = {
          customer: parseInt(id),
          method: values.method,
          date: values.date ? new Date(values.date) : null,
          notes: values.notes,
          files: publicUrls,
        };

        const createdCommunication =
          await communicationRepository.create(newCommunication);

        if (createdCommunication) {
          openSnackbar({
            open: true,
            message: "Communication recorded successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Communication could not be recorded successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate(`/customers/${id}/edit?tab=Communication`);
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Communication could not be recorded successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
      navigate(`/customers/${id}/edit?tab=Communication`);
    }
  }
  return {
    validate,
    onSubmit,
    selectedFiles,
    addFiles,
    removeFileFromIdx,
  };
}
