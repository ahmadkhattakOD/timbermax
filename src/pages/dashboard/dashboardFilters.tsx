import React from "react";
import {
  Box,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { FilterList, Clear } from "@mui/icons-material";
import { DashboardFilters as Filters } from "./useDashboard";

interface DashboardFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const timeRanges = [
    { value: "", label: "All time" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  const handleClearFilters = () => {
    onFilterChange({
      timeRange: "",
      startDate: undefined,
      endDate: undefined,
      warehouse: undefined,
      itemCategory: undefined,
      customer: undefined,
      status: undefined,
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <FilterList />
        <Typography variant="h6">Filters</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Clear all filters">
          <IconButton onClick={handleClearFilters} size="small">
            <Clear />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems="center"
      >
        {/* Time Range */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={filters.timeRange}
            label="Time Range"
            onChange={(e) =>
              onFilterChange({ timeRange: e.target.value as any })
            }
          >
            {timeRanges.map((range) => (
              <MenuItem key={range.value} value={range.value}>
                {range.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date Range (only for custom) */}
        {filters.timeRange === "custom" && (
          <>
            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={filters.startDate || ""}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              size="small"
              type="date"
              label="End Date"
              value={filters.endDate || ""}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          </>
        )}

        {/* Active Filters Display */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {filters.timeRange !== "" && (
            <Chip
              label={`Time: ${
                timeRanges.find((t) => t.value === filters.timeRange)?.label
              }`}
              size="small"
              onDelete={() => onFilterChange({ timeRange: "" })}
            />
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

export default DashboardFilters;
