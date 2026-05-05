import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    transition: "all 0.2s ease-in-out",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    "&.Mui-focused": {
      color: theme.palette.primary.main,
    },
  },
  "& .MuiFormHelperText-root": {
    marginLeft: 0,
    fontSize: "0.75rem",
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    transition: "all 0.2s ease-in-out",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    "&.Mui-focused": {
      color: theme.palette.primary.main,
    },
  },
}));

interface FormFieldProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "textarea" | "select";
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  options?: Array<{ value: string | number; label: string }>;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  size?: "small" | "medium";
  helperText?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
}

const FormField: React.FC<FormFieldProps> = ({
  type = "text",
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  multiline = false,
  rows = 3,
  options = [],
  startIcon,
  endIcon,
  fullWidth = true,
  size = "medium",
  helperText,
  maxLength,
  min,
  max,
  step,
}) => {
  const handleChange = (event: any) => {
    onChange(event.target.value);
  };

  if (type === "select") {
    return (
      <StyledFormControl
        fullWidth={fullWidth}
        error={!!error}
        required={required}
        disabled={disabled}
        size={size}
      >
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          label={label}
          onChange={handleChange}
          startAdornment={startIcon && (
            <InputAdornment position="start">
              {startIcon}
            </InputAdornment>
          )}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {(error || helperText) && (
          <FormHelperText>{error || helperText}</FormHelperText>
        )}
      </StyledFormControl>
    );
  }

  return (
    <StyledTextField
      type={type}
      label={label}
      value={value}
      onChange={handleChange}
      error={!!error}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      multiline={multiline || type === "textarea"}
      rows={rows}
      fullWidth={fullWidth}
      size={size}
      helperText={error || helperText}
      inputProps={{
        maxLength,
        min,
        max,
        step,
      }}
      InputProps={{
        startAdornment: startIcon && (
          <InputAdornment position="start">
            {startIcon}
          </InputAdornment>
        ),
        endAdornment: endIcon && (
          <InputAdornment position="end">
            {endIcon}
          </InputAdornment>
        ),
      }}
    />
  );
};

export default FormField; 