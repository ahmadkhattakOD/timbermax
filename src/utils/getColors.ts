// material-ui
import { Theme } from '@mui/material/styles';

// types
import { ColorProps } from 'types/extended';

// ==============================|| CUSTOM FUNCTION - COLORS ||============================== //

export default function getColors(theme: Theme, color?: ColorProps) {
  switch (color!) {
    case 'secondary':
      return theme.palette.secondary;
    case 'error':
      return theme.palette.error;
    case 'warning':
      return theme.palette.warning;
    case 'info':
      return theme.palette.info;
    case 'success':
      return theme.palette.success;
    default:
      return theme.palette.primary;
  }
}

export const getStockStyles = (qty: number) => {
  if (qty <= 0) {
    return {
      backgroundColor: "#DC2626", // red-600
      color: "#FFFFFF",
    };
  }

  if (qty <= 10) {
    return {
      backgroundColor: "#FEE2E2", // red-100
      color: "#991B1B",           // red-800
    };
  }

  if (qty <= 20) {
    return {
      backgroundColor: "#FFEDD5", // orange-100
      color: "#9A3412",           // orange-800
    };
  }

  return {
    backgroundColor: "#", // green-100
    color: "#",           // green-800
  };
};
