import { openSnackbar } from "api/snackbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SnackbarProps } from "types/snackbar";
import { isNumeric } from "utils/helpers";
import StocksRepository from "utils/repositories/stocksRepository";

export interface ValuesEditStock {
  newQuantity: string;
  notes: string;
  correctQuantity: string;
  reason: string;
}

export function useEditStock() {
  const navigate = useNavigate();
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  function validate(values: ValuesEditStock) {
    const errors = {} as ValuesEditStock;

    const hasAdd = values.newQuantity !== "" && values.newQuantity !== "0" && values.newQuantity !== undefined;
    const hasCorrect = values.correctQuantity !== "" && values.correctQuantity !== undefined;

    if (!hasAdd && !hasCorrect) {
      errors.newQuantity = "Fill in quantity to add or a corrected quantity";
    }

    if (hasAdd && hasCorrect) {
      errors.newQuantity = "Use only one: either add quantity or correct quantity, not both";
      errors.correctQuantity = "Use only one: either add quantity or correct quantity, not both";
    }

    if (hasAdd) {
      const val = parseFloat(values.newQuantity);
      if (isNaN(val) || val <= 0) {
        errors.newQuantity = "must be a positive number";
      }
    }

    if (hasCorrect) {
      const val = parseFloat(values.correctQuantity);
      if (isNaN(val) || val < 0) {
        errors.correctQuantity = "cannot be negative";
      }
      if (!values.reason || !values.reason.trim()) {
        errors.reason = "required when correcting quantity";
      }
    }

    return errors;
  }

  async function onSubmit(values: ValuesEditStock) {
    try {
      if (!id || !isNumeric(id) || !stock) {
        openSnackbar({
          open: true,
          message: "Stock could not be updated. Please try again.",
          variant: "alert",
          alert: { color: "error" },
        } as SnackbarProps);
        navigate("/stock");
        return;
      }

      const stocksRepository = new StocksRepository();
      const hasAdd = values.newQuantity !== "" && values.newQuantity !== "0";

      if (hasAdd) {
        // Add quantity → type "in"
        const added = await stocksRepository.create(
          {
            item: stock.item.id,
            warehouse: stock.warehouse.id,
            quantity: parseFloat(values.newQuantity),
          },
          values.notes || undefined,
        );

        if (added) {
          openSnackbar({
            open: true,
            message: "Stock added successfully.",
            variant: "alert",
            alert: { color: "success" },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message: "Stock could not be added. Please try again.",
            variant: "alert",
            alert: { color: "error" },
          } as SnackbarProps);
        }
      } else {
        // Correct quantity → type "adjustment"
        const result = await stocksRepository.adjustStock(
          stock.id,
          stock.item.id,
          stock.warehouse.id,
          parseFloat(values.correctQuantity),
          values.reason.trim(),
        );

        if (result.success) {
          openSnackbar({
            open: true,
            message: "Stock quantity corrected successfully.",
            variant: "alert",
            alert: { color: "success" },
          } as SnackbarProps);
        } else {
          openSnackbar({
            open: true,
            message: result.error || "Stock could not be corrected. Please try again.",
            variant: "alert",
            alert: { color: "error" },
          } as SnackbarProps);
        }
      }

      navigate("/stock");
    } catch (e) {
      openSnackbar({
        open: true,
        message: "Stock could not be updated. Please try again.",
        variant: "alert",
        alert: { color: "error" },
      } as SnackbarProps);
      navigate("/stock");
    }
  }

  async function getStock() {
    setLoading(true);
    if (id && isNumeric(id)) {
      const stocksRepository = new StocksRepository();
      const existingStock = await stocksRepository.getSingle(parseInt(id));
      if (existingStock) {
        const { stockData, stockError } = existingStock;
        if (stockData && !stockError) {
          setStock(stockData);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getStock();
  }, []);

  return { validate, onSubmit, stock, loading };
}
