import {
  Box,
  Typography,
  styled,
  useTheme,
  Autocomplete,
  TextField,
  CircularProgress,
} from "@mui/material";
import React, { ReactNode, useState } from "react";
import { FormattedMessage } from "react-intl";

interface FieldInputProps {
  id: string;
  name: string;
  label?: string;
  secondaryLabel?: ReactNode | string | null;
  value?: any;
  optional?: true | false;
  error?: string;
  disabled?: boolean;
  defaultValue?: string;
  options: readonly any[];
  useFormattedStrings?: boolean;
  disabledValues?: any[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (e: any) => void;
  loading: boolean;
  onClickCreateNew?: () => void;
}

const InputDropdown = ({
  label,
  secondaryLabel,
  value,
  name,
  id,
  optional = true,
  error,
  disabled,
  options,
  onChange,
  onSelect,
  loading,
  onClickCreateNew,
}: FieldInputProps) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <FieldInputStyle primaryColor={theme.palette.primary.main}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          mb: label && "0.5rem",
        }}
      >
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
            {label && <FormattedMessage id={label} />}
          </Typography>
          {!optional && <Typography sx={{ color: "red" }}>*</Typography>}
        </Box>
        {secondaryLabel && (
          <Typography
            sx={{ color: theme.palette.secondary.dark, fontSize: "16px" }}
          >
            {secondaryLabel}
          </Typography>
        )}
      </Box>
      <div className={"group-input"}>
        <Autocomplete
          disabled={disabled}
          id={id}
          sx={{ width: "100%", border: "none" }}
          open={open}
          onOpen={() => {
            setOpen(true);
          }}
          onClose={() => {
            setOpen(false);
          }}
          onChange={onSelect}
          value={value}
          isOptionEqualToValue={(option, value) => option.id == value}
          filterOptions={(x) => x}
          getOptionLabel={(option) => option.name}
          getOptionKey={(option) => option.id}
          noOptionsText={
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              Not found. Try searching again.{" "}
              {onClickCreateNew && (
                <Box
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={onClickCreateNew}
                >
                  Create?
                </Box>
              )}
            </Box>
          }
          options={options}
          loading={loading}
          autoComplete={false}
          ListboxProps={{
            sx: { maxHeight: "40vh", overflowY: "auto" },
          }}
          renderOption={(props, option) => {
            const { key, ...restProps } = props as any;
            const prop = { ...restProps };
            return (
              <li key={key} {...prop} value={option.id}>
                {option.name}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              name={name}
              onChange={onChange}
              autoComplete="off"
              type="search"
              sx={{ border: "none", borderRadius: 0 }}
              InputProps={{
                ...params.InputProps,
                sx: { border: "none" },
                endAdornment: (
                  <React.Fragment>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
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
    padding: "0 1rem 0 0",
    backgroundColor: "white",
    border: `1px solid lightgray`,
    // height: '48px',
    borderRadius: "8px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "1rem",
    "& .MuiAutocomplete-root": {
      border: "none",
    },
    "& .Mui-focused": {
      boxShadow: "none",
    },
    "& input": {
      padding: "0.8rem",
      color: "black",
      backgroundColor: "transparent !important",
      fontSize: "14px",
      border: "none",
      borderRadius: "8px",
      boxShadow: "none",
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
    "& fieldset": {
      border: "none !important",
    },
  },
  ".error": {
    color: "red",
  },
}));

export default InputDropdown;
