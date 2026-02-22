// project-imports
import { ThemeMode } from "config";

// types
import { PaletteThemeProps } from "types/theme";

// ==============================|| PRESET THEME - DEFAULT ||============================== //

export default function Default(mode: ThemeMode): PaletteThemeProps {
  const contrastText = "#fff";

  // LIGHT MODE (default)
  let primaryColors = [
    "#F7EFE8", // very light brown tint
    "#EADBCB",
    "#DBC3AA",
    "#CBAA89",
    "#B88E66",
    "#9C6A3A", // main brown
    "#87592F",
    "#704826",
    "#5A381E",  
    "#422815",
  ];

  // Clean, professional neutral gray — visible without being washed out
  let secondaryColors = [
    "#FFFFFF", // pure white for backgrounds
    "#F9FAFB", // near-white surface
    "#F3F4F6", // very light gray
    "#E5E7EB", // light gray (borders/dividers)
    "#D1D5DB", // medium-light gray
    "#9CA3AF", // medium gray
    "#6B7280", // main — clearly visible, professional gray
    "#4B5563", // dark gray
    "#374151", // very dark gray
    "#1F2937", // near black
  ];

  let errorColors = ["#FDECEC", "#F8CFC9", "#F29B8F", "#E15C4C", "#B9382C"];
  let warningColors = ["#FFF4D6", "#FFE1A3", "#FFC861", "#E6A23C", "#B8821E"];
  let infoColors = ["#E6F4F1", "#BFE3DD", "#8CCDC3", "#5EB5A9", "#2F8F84"];
  let successColors = ["#E9F7EF", "#C8EAD7", "#96D5B6", "#5CBF8E", "#2E8B57"];

  // DARK MODE - richer, deeper colors
  if (mode === ThemeMode.DARK) {
    primaryColors = [
      "#422815",
      "#5A381E",
      "#704826",
      "#87592F",
      "#9C6A3A",
      "#B88E66",
      "#CBAA89",
      "#DBC3AA",
      "#EADBCB",
      "#F7EFE8",
    ];

    secondaryColors = [
      "#0F0C0A", // near black
      "#1B1613", // very dark brown
      "#241E1A", // dark brown
      "#2E2621", // medium-dark brown
      "#3A302A", // brown-gray
      "#4A3D35", // medium brown
      "#5E5046", // light brown
      "#77665A", // lighter brown
      "#9A8A7E", // pale brown
      "#C2B6AE", // very pale brown
    ];
  }

  return {
    primary: {
      lighter: primaryColors[0],
      100: primaryColors[1],
      200: primaryColors[2],
      light: primaryColors[3],
      400: primaryColors[4],
      main: primaryColors[5],
      dark: primaryColors[6],
      700: primaryColors[7],
      darker: primaryColors[8],
      900: primaryColors[9],
      contrastText,
    },
    secondary: {
      lighter: secondaryColors[0],
      100: secondaryColors[1],
      200: secondaryColors[2],
      light: secondaryColors[3],
      400: secondaryColors[4],
      500: secondaryColors[5],
      main: secondaryColors[6],
      dark: secondaryColors[7],
      800: secondaryColors[8],
      darker: secondaryColors[9],
      contrastText: mode === ThemeMode.DARK ? "#FFFFFF" : "#1F2937",
    },
    error: {
      lighter: errorColors[0],
      light: errorColors[1],
      main: errorColors[2],
      dark: errorColors[3],
      darker: errorColors[4],
      contrastText,
    },
    warning: {
      lighter: warningColors[0],
      light: warningColors[1],
      main: warningColors[2],
      dark: warningColors[3],
      darker: warningColors[4],
      contrastText,
    },
    info: {
      lighter: infoColors[0],
      light: infoColors[1],
      main: infoColors[2],
      dark: infoColors[3],
      darker: infoColors[4],
      contrastText,
    },
    success: {
      lighter: successColors[0],
      light: successColors[1],
      main: successColors[2],
      dark: successColors[3],
      darker: successColors[4],
      contrastText,
    },
  };
}

// Updated brand colors with better contrast
export const BRAND_COLORS = {
  primary: [156, 106, 58], // #9C6A3A (main brown)
  primaryDark: [135, 89, 47], // #87592F
  primaryLight: [199, 170, 137], // #CBAA89
  
  tableBorder: [229, 231, 235], // #E5E7EB - clean neutral border
  textDark: [31, 41, 55], // #1F2937 - crisp dark text
};  