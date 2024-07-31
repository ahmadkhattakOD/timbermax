import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { acceptedFileTypes, confirmFileSize, isNumeric } from "utils/helpers";
import CommunicationRepository, {
  CommunicationSupabase,
} from "utils/repositories/communicationRepository";

export interface ValuesEditWarehouse {
  method: string;
  notes: string;
  date: string;
}

export function useEditCommunication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [communication, setCommunication] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [toDeleteAttachments, setToDeleteAttachments] = useState<number[]>([]);
  const [isDownloadingAttachment, setIsDownloadingAttachment] = useState<boolean>(false);
  const { id, iid } = useParams();

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
        if (files[i].name.split(".").length > 1) {
          const extension = files[i].name.split(".").pop();
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

  async function downloadExistingFile(url: string) {
    setIsDownloadingAttachment(true);
    const communicationRepository = new CommunicationRepository();
    const downloadedFile =
      await communicationRepository.downloadAttachment(url);
    if (!downloadedFile) {
      openSnackbar({
        open: true,
        message: "File could not be downloaded successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);
    }
    setIsDownloadingAttachment(false);
  }

  function restoreExistingFile(idx: number) {
    let temp = [...toDeleteAttachments];
    temp = temp.filter((i) => i !== idx);
    setToDeleteAttachments(temp);
  }

  function deleteExistingFile(idx: number) {
    setToDeleteAttachments((attachments) => [...attachments, idx]);
  }

  function validate(values: ValuesEditWarehouse) {
    const errors = {} as ValuesEditWarehouse;

    if (!values.method.trim()) {
      errors.method = "required";
    }

    if (!values.date.trim()) {
      errors.date = "required";
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditWarehouse) {
    try {
      if (id && isNumeric(id) && iid && isNumeric(iid)) {
        const communicationRepository = new CommunicationRepository();

        let remainingAttachments: string[] = existingAttachments;

        if (toDeleteAttachments.length > 0) {
          let urlsToDelete: string[] = [];
          for (let i = 0; i < toDeleteAttachments.length; i++) {
            let urlToDelete = remainingAttachments.at(toDeleteAttachments[i]);
            if (urlToDelete) {
              urlsToDelete.push(urlToDelete);
            }
          }

          const deleted =
            await communicationRepository.deleteAttachments(urlsToDelete);

          if (!deleted) {
            openSnackbar({
              open: true,
              message:
                "File(s) could not be deleted successfully. Please try again.",
              variant: "alert",
              alert: {
                color: "error",
              },
            } as SnackbarProps);
          } else {
            const indexesSet = new Set(toDeleteAttachments);
            remainingAttachments = remainingAttachments.filter(
              (_, idx) => !indexesSet.has(idx)
            );
          }
        }

        let publicUrls: string[] = [];
        if (selectedFiles.length > 0) {
          publicUrls =
            await communicationRepository.uploadAttachmentsAndReturnUrls(
              selectedFiles
            );
        }

        let updatedFiles = [...publicUrls, ...remainingAttachments];

        const updatedCommunication: CommunicationSupabase = {
          customer: parseInt(id),
          method: values.method,
          date: values.date ? new Date(values.date) : null,
          notes: values.notes,
          files: updatedFiles,
        };

        const editedCommunication = await communicationRepository.edit(
          parseInt(iid),
          updatedCommunication
        );

        if (editedCommunication) {
          openSnackbar({
            open: true,
            message: "Communication edited successfully.",
            variant: "alert",
            alert: {
              color: "success",
            },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message:
              "Communication could not be edited successfully. Please try again.",
            variant: "alert",
            alert: {
              color: "error",
            },
          } as SnackbarProps);
        }

        navigate(`/customers/${id}/edit?tab=Communication`);
      } else {
        openSnackbar({
          open: true,
          message:
            "Communication could not be edited successfully. Please try again.",
          variant: "alert",
          alert: {
            color: "error",
          },
        } as SnackbarProps);

        navigate(`/customers/${id}/edit?tab=Communication`);
      }
    } catch (e) {
      openSnackbar({
        open: true,
        message:
          "Communication could not be edited successfully. Please try again.",
        variant: "alert",
        alert: {
          color: "error",
        },
      } as SnackbarProps);

      navigate(`/customers/${id}/edit?tab=Communication`);
    }
  }

  async function getCommunication() {
    setLoading(true);
    if (iid && isNumeric(iid)) {
      const communicationRepository = new CommunicationRepository();
      const existingCommunication = await communicationRepository.getSingle(
        parseInt(iid)
      );
      if (existingCommunication) {
        const { communicationData, communicationError } = existingCommunication;
        if (communicationData && !communicationError) {
          setCommunication(communicationData);
          setExistingAttachments(communicationData.files ?? []);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getCommunication();
  }, []);

  return {
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
    isDownloadingAttachment
  };
}
