import { Box, Modal, Typography, useTheme } from "@mui/material";
import { Form, Formik, FormikHelpers } from "formik";
import { deleteConfirmationText } from "utils/helpers";
import ActionButton from "./ActionButton";
import FormInput from "./FormInput";
import { FormattedMessage } from "react-intl";

interface ModalDeleteProps {
  open: boolean;
  onClose: () => void;
  onDelete: any;
}

interface DeleteValues {
  confirmation: string;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: "525px",
  maxHeight: "360px",
  boxShadow: 5,
  p: 4,
  padding: "1.5rem",
  borderRadius: "20px",
  backgroundColor: "white",
};

const ModalDeleteConfirm = ({ open, onClose, onDelete }: ModalDeleteProps) => {
  const theme = useTheme();

  return (
    <Modal open={open} onClose={onClose} className="content">
      <Box sx={style}>
        <Typography
          fontSize={"20px"}
          textAlign={"left"}
          color={theme.palette.text.primary}
        >
          <FormattedMessage id="delete-confirmation" />
        </Typography>
        <Typography
          marginTop={"15px"}
          fontSize={"12px"}
          textAlign={"left"}
          color={theme.palette.text.secondary}
        >
          <FormattedMessage id="delete-confirmation-detail" />
        </Typography>
        <Box sx={{ paddingTop: "2rem" }}>
          <Formik
            initialValues={{
              confirmation: "",
            }}
            validate={(values) => {
              const errors = {} as DeleteValues;

              if (values.confirmation !== deleteConfirmationText) {
                errors.confirmation = "delete-confirmation-error";
              }

              return errors;
            }}
            onSubmit={async () => {
              await onDelete();
              onClose();
            }}
          >
            {({ errors, touched, handleSubmit }) => (
              <Form>
                <Box
                  borderRadius={"20px"}
                  marginBottom={"2px"}
                  width={"100%"}
                  display={"flex"}
                  flexDirection={"column"}
                  gap={"1.5rem"}
                >
                  <FormInput
                    optional={false}
                    label="confirmation"
                    id="confirmation"
                    name={"confirmation"}
                    placeholder="I am sure"
                    type="text"
                    error={touched.confirmation ? errors.confirmation : ""}
                  />
                </Box>
                <Box
                  display={"flex"}
                  justifyContent={"space-evenly"}
                  gap={"15px"}
                  marginTop={"2rem"}
                >
                  <ActionButton
                    onClick={onClose}
                    color={"secondary"}
                    text={"cancel"}
                  />
                  <ActionButton
                    onClick={handleSubmit}
                    color="error"
                    text={"delete"}
                  />
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalDeleteConfirm;
