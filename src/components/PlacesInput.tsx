import { Box, Typography, styled, Checkbox, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { Field, useField } from "formik";
import { FormattedMessage } from "react-intl";
import { Eye, EyeSlash } from "iconsax-react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

interface PlacesInputProps {
  id: string;
  name: string;
  label?: string;
  secondaryLabel?: string | null;
  placeholder?: string;
  value?: string;
  optional?: true | false;
  type?: string;
  min?: any;
  max?: any;
  error?: string;
  defaultValue?: string;
  disabled?: boolean;
  isTextArea?: boolean;
  isPasswordField?: boolean;
  onChangePasswordVisibility?: () => void;
  onChange: (newValue: any, actionMeta: any) => void;
}

const PlacesInput = ({
  label,
  secondaryLabel,
  value,
  name,
  placeholder,
  optional = true,
  error,
  disabled,
  onChange,
}: PlacesInputProps) => {
  const [visible, setVisible] = useState(true);
  const theme = useTheme();

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          mb: label && "0.5rem",
        }}
      >
        {label && (
          <Box
            sx={{
              display: "flex",
              gap: "10px",
            }}
          >
            <Typography
              sx={{
                color: disabled
                  ? theme.palette.text.disabled
                  : theme.palette.text.primary,
                fontSize: "16px",
              }}
            >
              <FormattedMessage id={label} />
            </Typography>
            {!optional && <Typography sx={{ color: "red" }}>*</Typography>}
          </Box>
        )}
        {secondaryLabel && (
          <Typography
            sx={{ color: theme.palette.secondary.dark, fontSize: "16px" }}
          >
            {secondaryLabel}
          </Typography>
        )}
      </Box>
      {/* <GooglePlacesAutocomplete
        apiKey={import.meta.env.VITE_APP_MAPS_KEY}
        autocompletionRequest={{
          componentRestrictions: { country: ["au"] },
        }}
        debounce={750}
        minLengthAutocomplete={3}
        selectProps={{
          name: name,
          onChange: (newValue, action) => {
            onChange(newValue, action);
            setVisible(true);
          },
          onFocus: (e) => {
            setVisible(false);
          },
          onBlur: (e) => {
            setVisible(true);
          },
          placeholder: placeholder,
          value: value ? { label: value, value: { description: value } } : null,
          styles: {
            control: (provided) => ({
              ...provided,
              borderRadius: "8px",
              border: "1px solid lightgray",
              ":focus": {
                border: `1px solid red`,
                boxShadow: `0 0 0 2px rgba(70, 128, 255, 0.1)`,
                outline: "none",
                backgroundColor: "transparent",
              },
            }),
            dropdownIndicator: (provided) => ({
              ...provided,
              display: "none",
            }),
            indicatorSeparator: () => ({
              display: "none",
            }),
            input: (provided) => ({
              ...provided,
              color: "black",
              backgroundColor: "transparent !important",
              fontSize: "14px",
              paddingTop: "0.4rem",
              paddingBottom: "0.4rem",
              border: `none`,
              borderRadius: "8px",
              flex: 1,
              width: "100%",
            }),
            placeholder: (provided, state) => ({
              ...provided,
              display: state.isFocused ? "none" : undefined,
            }),
            singleValue: (provided, state) => ({
              ...provided,
              // display: state.hasValue ? "block" : visible ? "block" : "none",
              opacity: visible ? 1 : 0.5,
            }),
          },
        }}
      /> */}

      {error && (
        <Typography variant="caption" className="error">
          <FormattedMessage id={error} />
        </Typography>
      )}
    </>
  );
};

const PlacesInputStyle = styled("div")<{ primaryColor: string }>((props) => ({
  width: "100%",
  "& .group-input": {
    // padding: "0 1rem",
    // backgroundColor: "white",
    // height: '48px',
    borderRadius: "8px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "1rem",
    "& .input": {
      color: "black",
      backgroundColor: "transparent !important",
      fontSize: "14px",
      padding: "0.8rem",
      border: `1px solid lightgray`,
      borderRadius: "8px",
      flex: 1,
      width: "100%",
      "&:focus": {
        border: `1px solid ${props?.primaryColor}`,
        boxShadow: `0 0 0 2px rgba(70, 128, 255, 0.1)`,
        outline: "none",
        backgroundColor: "transparent",
      },
      "&:-webkit-autofill": {
        outline: "none",
        backgroundColor: "transparent",
        // "-webkit-background-clip": "text",
        // "-webkit-text-fill-color": "#ffffff",
        transition: "background-color 5000s ease-in-out 0s",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "black",
      },
      "&:-webkit-autofill:focus ": {
        outline: "none",
        backgroundColor: "transparent",
      },
      "&:active": {
        outline: "none",
        backgroundColor: "transparent",
      },
      "&:target": {
        outline: "none",
        backgroundColor: "transparent",
      },
    },
  },

  ".error": {
    color: "red",
  },
}));

export default PlacesInput;
