import * as React from "react";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { visuallyHidden } from "@mui/utils";
import { Filter, Trash } from "iconsax-react";
import { useDataTable } from "./useDataTable";
import { FormattedMessage } from "react-intl";

export type Order = "asc" | "desc";

export interface HeadCell {
  disablePadding: boolean;
  id: string;
  label: string;
  numeric: boolean;
}

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  headCells: HeadCell[];
  selectable?: boolean;
}

interface EnhancedTableToolbarProps {
  numSelected: number;
  tableTitle: string;
  openDeleteConfirmModal: () => void;
  openFilterModal: () => void;
}

interface DataTableProps {
  data: any[];
  dataCount: number;
  loading: boolean;
  tableTitle: string;
  selected: readonly any[];
  setSelected: React.Dispatch<React.SetStateAction<readonly any[]>>;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  page: number;
  setPage: (value: number) => void;
  orderBy: string;
  setOrderBy: (value: string) => void;
  order: Order;
  setOrder: (value: Order) => void;
  headCells: HeadCell[];
  generateTableCells: (
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) => React.ReactElement;
  openDeleteConfirmModal: () => void;
  openFilterModal: () => void;
  selectable?: boolean;
  takeToOnClick?: string;
  clickable?: boolean;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    headCells,
    selectable = true,
  } = props;
  const createSortHandler =
    (property: string) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {selectable && (
          <TableCell padding="checkbox">
            <Checkbox
              color="primary"
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{
                "aria-label": "select all desserts",
              }}
            />
          </TableCell>
        )}
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function EnhancedTableToolbar({
  numSelected,
  tableTitle,
  openDeleteConfirmModal,
  openFilterModal,
}: EnhancedTableToolbarProps) {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            ),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: "1 1 100%" }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      ) : (
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          <FormattedMessage id={tableTitle} />
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={openDeleteConfirmModal}>
            <Trash />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filters">
          <IconButton onClick={openFilterModal}>
            <Filter />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

export default function DataTable({
  data,
  dataCount,
  loading,
  tableTitle,
  selected,
  setSelected,
  rowsPerPage,
  setRowsPerPage,
  page,
  setPage,
  orderBy,
  setOrderBy,
  order,
  setOrder,
  headCells,
  generateTableCells,
  openDeleteConfirmModal,
  openFilterModal,
  selectable = true,
  takeToOnClick = 'edit',
  clickable = true
}: DataTableProps) {
  const {
    handleRequestSort,
    handleSelectAllClick,
    handleRowClick,
    handleChangePage,
    handleChangeRowsPerPage,
    isSelected,
    emptyRows,
  } = useDataTable({
    data: data,
    dataCount: dataCount,
    selected: selected,
    setSelected: setSelected,
    rowsPerPage: rowsPerPage,
    setRowsPerPage: setRowsPerPage,
    page: page,
    setPage: setPage,
    orderBy: orderBy,
    setOrderBy: setOrderBy,
    order: order,
    setOrder: setOrder,
    takeToOnClick: takeToOnClick,
    clickable: clickable
  });

  return (
    <Box>
      <Paper sx={{ width: "100%", mb: 2, borderRadius: "8px" }}>
        <EnhancedTableToolbar
          numSelected={selected.length}
          tableTitle={tableTitle}
          openDeleteConfirmModal={openDeleteConfirmModal}
          openFilterModal={openFilterModal}
        />
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size={"medium"}
          >
            <EnhancedTableHead
              headCells={headCells}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={dataCount}
              selectable={selectable}
            />
            {loading ? (
              <React.Fragment></React.Fragment>
            ) : (
              <TableBody>
                {data.map((row, index) => {
                  const isItemSelected = isSelected(row.id);
                  const labelId = `enhanced-table-checkbox-${index}`;
                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleRowClick(event, row.id)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.id}
                      selected={isItemSelected}
                      sx={{ cursor: "pointer" }}
                    >
                      {generateTableCells(row, labelId, isItemSelected)}
                    </TableRow>
                  );
                })}
                {emptyRows > 0 && (
                  <TableRow
                    style={{
                      height: 54 * emptyRows,
                    }}
                  >
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 75, 100]}
          component="div"
          count={dataCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
