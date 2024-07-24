import { Box, Modal, Typography, useTheme } from "@mui/material";
import { FormattedMessage } from "react-intl";
import { ReactElement } from "react";
import { maxHeight } from "@mui/system";

interface ModalFiltersProps {
  open: boolean;
  onClose: () => void;
  title: string;
  form: ReactElement;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: "900px",
  maxHeight: "80%",
  overflow: "scroll",
  boxShadow: 5,
  p: 4,
  padding: "1.5rem",
  borderRadius: "20px",
  backgroundColor: "white",
};

const ModalFilters = ({ open, onClose, title, form }: ModalFiltersProps) => {
  const theme = useTheme();

  return (
    <Modal open={open} onClose={onClose} className="content">
      <Box sx={style}>
        <Typography
          fontSize={"20px"}
          textAlign={"left"}
          color={theme.palette.text.primary}
        >
          <FormattedMessage id={title} />
        </Typography>
        <Typography
          marginTop={"15px"}
          fontSize={"12px"}
          textAlign={"left"}
          color={theme.palette.text.secondary}
        >
          <FormattedMessage id="filter-details" />
        </Typography>
        <Box sx={{ paddingTop: "2rem" }}>
          {/* <Formik
            enableReinitialize
            initialValues={initialValues}
            validate={validate}
            onSubmit={onSubmit}
          >
            {({ handleSubmit, errors, touched, isSubmitting, values }) => (
              <Form onSubmit={handleSubmit}>
                <FormLayout
                  isSubmitting={isSubmitting}
                  submitButtonText={"apply"}
                  inputs={inputs}
                  showSubmitButton={false}
                />
                <Box
                  display={"flex"}
                  justifyContent={"center"}
                  gap={"15px"}
                  marginTop={"2rem"}
                >
                  <ActionButton
                    onClick={onClose}
                    color={"secondary"}
                    text={"cancel"}
                  />
                  <ActionButton type='submit' text={"apply"} />
                </Box>
              </Form>
            )}
          </Formik> */}
          {form}
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalFilters;
