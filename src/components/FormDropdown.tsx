import { Box, Typography, styled, Checkbox, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { Field, useField } from "formik";
import { FormattedMessage } from "react-intl";

interface LabelValue {
  label: string;
  value: string;
}

interface FieldInputProps {
  id: string;
  name: string;
  label?: string;
  value?: string;
  optional?: true | false;
  error?: string;
  disabled?: boolean;
  defaultValue?: string;
  options: string[] | number[] | LabelValue[];
  useFormattedStrings?: boolean;
}

const FormDropdown = ({
  label,
  value,
  name,
  id,
  optional = true,
  error,
  disabled,
  defaultValue,
  options,
  useFormattedStrings = true,
}: FieldInputProps) => {
  const [field, __, helpers] = useField(name);
  const theme = useTheme();

  function isLabelValueArray(options: any[]): options is LabelValue[] {
    // Check if every element in the array has 'label' and 'value' properties
    return options.every(
      (option) =>
        typeof option === "object" && "label" in option && "value" in option
    );
  }

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
          as="select"
          id={id}
          name={name}
          className="input"
          disabled={disabled}
        >
          <option disabled value="">
            {useFormattedStrings ? <FormattedMessage id="select" /> : "Select"}
          </option>
          {isLabelValueArray(options)
            ? options.map((option, idx) => (
                <option key={idx} value={option.value}>
                  {useFormattedStrings ? (
                    <FormattedMessage id={option.label} />
                  ) : (
                    option.label
                  )}
                </option>
              ))
            : options.map((option, idx) => (
                <option key={idx} value={option.toString()}>
                  {useFormattedStrings ? (
                    <FormattedMessage id={option.toString()} />
                  ) : (
                    option.toString()
                  )}
                </option>
              ))}
        </Field>
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
    padding: "0 1rem 0 0",
    backgroundColor: "white",
    border: `1px solid lightgray`,
    // height: '48px',
    borderRadius: "8px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "1rem",
    "& .input": {
      padding: "0.8rem",
      color: "black",
      backgroundColor: "transparent !important",
      fontSize: "14px",
      border: "none",
      borderRadius: "8px",
      width: "100%",
      "&:focus": {
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

export default FormDropdown;
