import { Checkbox, TableCell } from "@mui/material";
import { HeadCell, Order } from "components/data-table/DataTable";
import React, { useState, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { getDateFormatted, initialRowsPerPage } from "utils/helpers";
import SalesRepository from "utils/repositories/sales-repository";
import WarehousesRepository from "utils/repositories/warehouses-repository";
import supabase from "utils/supabase";

const headCells: HeadCell[] = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "Name",
  },
  {
    id: "address",
    numeric: false,
    disablePadding: true,
    label: "Address",
  },
  {
    id: "state",
    numeric: false,
    disablePadding: true,
    label: "State",
  },
  {
    id: "post_code",
    numeric: false,
    disablePadding: true,
    label: "Post Code",
  },
];

export function useWarehouses() {
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  function goToCreate() {
    navigate("/warehouses/new");
  }

  function generateTableCells(
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) {
    return (
      <React.Fragment>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={isItemSelected}
            inputProps={{
              "aria-labelledby": labelId,
            }}
          />
        </TableCell>
        <TableCell
          component="th"
          id={labelId}
          scope="row"
          padding="none"
          width={200}
          align="left"
        >
          {row.name}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.state}
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          {row.address}
        </TableCell>
        <TableCell>{row.post_code}</TableCell>
      </React.Fragment>
    );
  }

  function onDelete() {
    console.log(selected);
  }

  async function getData() {
    try {
      setLoading(true);
      const warehousesRepository = new WarehousesRepository();
      const rangeStart = rowsPerPage * page;
      const rangeEnd = rangeStart + rowsPerPage;
      const warehouses = await warehousesRepository.get(
        orderBy,
        order === "asc",
        rangeStart,
        rangeEnd,
        rowsPerPage
      );
      if (warehouses) {
        const { warehousesData, warehousesCount, warehousesError } = warehouses;
        if (warehousesData && !warehousesError) {
          setData(warehousesData);
          setDataCount(warehousesCount ?? 0);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching warehouses:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, [order, orderBy, page, rowsPerPage]);

  return {
    data,
    dataCount,
    loading,
    goToCreate,
    order,
    setOrder,
    orderBy,
    setOrderBy,
    selected,
    setSelected,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    headCells,
    generateTableCells,
    onDelete
  };
}
