import { Box, Typography, styled, Checkbox, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { Field, useField } from "formik";
import { FormattedMessage } from "react-intl";

interface FieldInputProps {
  id: string;
  name: string;
  label?: string;
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
}

const FormInput = ({
  label,
  placeholder,
  value,
  name,
  min,
  max,
  id,
  type,
  optional = true,
  error,
  defaultValue,
  disabled,
  isTextArea = false
}: FieldInputProps) => {
  const [field, __, helpers] = useField(name);
  const theme = useTheme();

  useEffect(() => {
    if (value) {
      helpers.setValue(value);
    }
  }, []);

  return (
    <FieldInputStyle primaryColor={theme.palette.primary.main}>
      <Box
        sx={{
          display: "flex",
          justifyContent: optional ? "space-between" : "",
          gap: "10px",
          mb: label && "0.5rem",
        }}
      >
        <Typography
          sx={{ color: theme.palette.secondary.main, fontSize: "16px" }}
        >
          <FormattedMessage id={label} />
        </Typography>
        {!optional && <Typography sx={{ color: "red" }}>*</Typography>}
      </Box>
      <div className={"group-input"}>
        <Field
          as={isTextArea ? 'textarea' : 'input'}
          min={min}
          max={max}
          id={id}
          name={name}
          placeholder={placeholder}
          className="input"
          type={type}
          defaultValue={defaultValue}
          disabled={disabled}
        />
      </div>

      {error && (
        <Typography variant="caption" className="error">
          <FormattedMessage id={error} />
        </Typography>
      )}
    </FieldInputStyle>
  );
};

const FieldInputStyle = styled("div")<{ primaryColor: string }>((props) => ({
  width: "100%",
  color: "white",
  "& .group-input": {
    // padding: "0 1rem",
    backgroundColor: "white",
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

export default FormInput;
