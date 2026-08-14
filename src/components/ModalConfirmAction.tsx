import { Box, Modal, Typography, useTheme } from "@mui/material";
import ActionButton from "./ActionButton";
import { FormattedMessage } from "react-intl";

interface ModalConfirmActionProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  titleId: string;
  detailId?: string;
  confirmTextId?: string;
  confirmColor?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
}

const ModalConfirmAction = ({
  open,
  onClose,
  onConfirm,
  titleId,
  detailId,
  confirmTextId = "confirmation",
  confirmColor = "primary",
}: ModalConfirmActionProps) => {
  const theme = useTheme();

  const style = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%",
    maxWidth: "525px",
    boxShadow: 5,
    padding: "1.5rem",
    borderRadius: "20px",
    backgroundColor: theme.palette.background.paper,
    borderTop: `4px solid ${theme.palette.primary.main}`,
  };

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="content">
      <Box sx={style}>
        <Typography
          fontSize={"20px"}
          textAlign={"left"}
          color={theme.palette.text.primary}
        >
          <FormattedMessage id={titleId} />
        </Typography>
        {detailId && (
          <Typography
            marginTop={"15px"}
            fontSize={"12px"}
            textAlign={"left"}
            color={theme.palette.text.secondary}
          >
            <FormattedMessage id={detailId} />
          </Typography>
        )}
        <Box
          display={"flex"}
          justifyContent={"center"}
          gap={"15px"}
          marginTop={"2rem"}
        >
          <ActionButton onClick={onClose} color={"secondary"} text={"cancel"} />
          <ActionButton
            onClick={handleConfirm}
            color={confirmColor}
            text={confirmTextId}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalConfirmAction;
