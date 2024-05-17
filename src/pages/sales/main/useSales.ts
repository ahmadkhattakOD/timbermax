import { useNavigate } from "react-router";

export function useSales() {
  const navigate = useNavigate();

  function goToCreateSale() {
    navigate("/sales/new");
  }

  return { goToCreateSale };
}
