import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { isNumeric } from "utils/helpers";
import GeneratedInvoicesRepository from "utils/repositories/generatedInvoicesRepository";
import ProfilesRepository from "utils/repositories/profilesRepository";

export interface ValuesViewInvoice {
  wages: string;
  travelBonus: string;
  otherBonuses: string;
  deductions: string;
  totalCommission: string;
  cancelledSales: string;
}

export function useDownloadInvoice() {
  const [invoice, setInvoice] = useState<any>(null);
  const [fullName, setFullName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [grandTotal, setGrandTotal] = useState(0);
  const { id, iid } = useParams();

  async function getInvoiceProfile() {
    try {
      if (id && iid && isNumeric(iid)) {
        setLoading(true);
        const generatedInvoicesRepository = new GeneratedInvoicesRepository();
        const invoice = await generatedInvoicesRepository.getSingle(
          parseInt(iid)
        );
        if (invoice) {
          const { invoiceData, invoiceError } = invoice;
          if (invoiceData && !invoiceError) {
            setInvoice(invoiceData);
            setGrandTotal(
              (invoiceData.wages ?? 0) +
                (invoiceData.travel_bonus ?? 0) +
                (invoiceData.other_bonuses ?? 0) +
                (invoiceData.total_commission ?? 0) -
                (invoiceData.cancelled_sales ?? 0) -
                (invoiceData.deductions ?? 0)
            );
          }
        }
        const profilesRepository = new ProfilesRepository();
        const profile = await profilesRepository.getSingle(id);
        if (profile) {
          const { profileData, profileError } = profile;
          if (profileData && !profileError) {
            setFullName(profileData.full_name);
            setRole(profileData.role);
          }
        }
        setLoading(false);
      }
    } catch (e) {
      console.error("Error fetching invoice:", e);
    }
  }

  useEffect(() => {
    getInvoiceProfile();
  }, []);

  function validate(values: ValuesViewInvoice) {
    const errors = {} as ValuesViewInvoice;

    return errors;
  }

  return {
    invoice,
    fullName,
    loading,
    validate,
    grandTotal,
    role,
  };
}
