import { Dispatch, SetStateAction } from "react";
import { Order } from "./DataTable";
import { useNavigate } from "react-router";

interface UseDataTableProps {
  data: any[];
  dataCount: number;
  selected: readonly any[];
  setSelected: Dispatch<SetStateAction<readonly any[]>>;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  page: number;
  setPage: (value: number) => void;
  orderBy: string;
  setOrderBy: (value: string) => void;
  order: Order;
  setOrder: (value: Order) => void;
  takeToOnClick: string;
}

export function useDataTable({
  data,
  dataCount,
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
  takeToOnClick
}: UseDataTableProps) {
  const navigate = useNavigate();

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: string
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleRowClick = (event: React.MouseEvent<unknown>, id: any) => {
    const target = event.target as HTMLElement;

    if (
      target.tagName === "INPUT" &&
      (target as HTMLInputElement).type === "checkbox"
    ) {
      const selectedIndex = selected.indexOf(id);
      let newSelected: readonly number[] = [];
      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selected.slice(0, selectedIndex),
          selected.slice(selectedIndex + 1)
        );
      }
      setSelected(newSelected);
    }
    else {
      navigate(`${id}/${takeToOnClick}`);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - dataCount) : 0;

  return {
    handleRequestSort,
    handleSelectAllClick,
    handleRowClick,
    handleChangePage,
    handleChangeRowsPerPage,
    isSelected,
    emptyRows,
  };
}
