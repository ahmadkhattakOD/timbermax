import {
  Box,
  Typography,
  useTheme,
  InputAdornment,
  FormControl,
  OutlinedInput,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";
import { Field, useField } from "formik";
import { FormattedMessage } from "react-intl";
import { Eye, EyeSlash, SearchNormal } from "iconsax-react";

interface SearchInputProps {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  error?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchInput = ({
  placeholder,
  value,
  name,
  id,
  error,
  onChange,
  disabled,
  defaultValue,
}: SearchInputProps) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
      <FormControl sx={{ m: 1, width: "25ch" }} variant="outlined">
        <OutlinedInput
          sx={{ width: { xs: "100%", sm: "auto" } }}
          fullWidth
          id={id}
          name={name}
          placeholder={placeholder}
          type={"text"}
          defaultValue={defaultValue}
          value={value}
          disabled={disabled}
          autoComplete={undefined}
          endAdornment={
            <InputAdornment position="end">
              <SearchNormal size={"1rem"} />
            </InputAdornment>
          }
          onChange={onChange}
        />
      </FormControl>
      {/* <TextField
        sx={{ width: { xs: "100%", sm: "auto" } }}
        fullWidth
        id={id}
        name={name}
        placeholder={placeholder}
        type={"text"}
        defaultValue={defaultValue}
        value={value}
        disabled={disabled}
        autoComplete={undefined}
        endAdornment={
          <InputAdornment position="end">
            <SearchNormal />
          </InputAdornment>
        }
        onChange={onChange}
      /> */}

      {error && (
        <Typography variant="caption" className="error">
          <FormattedMessage id={error} />
        </Typography>
      )}
    </Box>
  );
};

export default SearchInput;
