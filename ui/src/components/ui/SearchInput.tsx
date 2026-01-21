/**
 * 搜索输入框组件
 */

import { Clear as ClearIcon, Search as SearchIcon } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField, type TextFieldProps } from "@mui/material";
import { type ChangeEvent, useCallback, useState } from "react";

export interface SearchInputProps extends Omit<TextFieldProps, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  clearable?: boolean;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  onClear,
  debounceMs = 300,
  clearable = true,
  placeholder = "搜索...",
  size = "small",
  ...props
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [controlledValue, onChange],
  );

  const handleClear = useCallback(() => {
    if (controlledValue === undefined) {
      setInternalValue("");
    }
    onChange?.("");
    onClear?.();
  }, [controlledValue, onChange, onClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && onSearch) {
        onSearch(value);
      }
    },
    [onSearch, value],
  );

  return (
    <TextField
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      size={size}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
          endAdornment:
            clearable && value ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClear} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
        },
      }}
      {...props}
    />
  );
}

export default SearchInput;
