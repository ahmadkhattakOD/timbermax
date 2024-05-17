import { FormikHelpers } from "formik";

const australianStates = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",
];

export interface ValuesCreateSale {
  contactName: string;
  opportunityDescription: string;
  deposit: string;
  total: string;
  paymentMethod: string;
  phone: string;
  address: string;
  state: string;
  postCode: string;
  emailAddress: string;
  note: string;
  salesPerson: string;
  closer: string;
  status: string;
  show: string;
  followUpNotes: string;
  saleDate: string;
}

export function useCreateSale() {
  function getTodaysDateFormatted() {
    return `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${new Date()
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  }

  function validate(values: ValuesCreateSale) {
    const errors = {} as ValuesCreateSale;

    return errors;
    if (!values.contactName.trim()) {
      errors.contactName = "required";
    }

    if (!values.salesPerson.trim()) {
      errors.salesPerson = "required";
    }

    if (!values.deposit || parseFloat(values.deposit) <= 0) {
      errors.deposit = "required-valid-number";
    }

    if (!values.total || parseFloat(values.total) <= 0) {
      errors.total = "required-valid-number";
    }

    if (!values.paymentMethod.trim()) {
      errors.paymentMethod = "required";
    }

    if (!values.closer.trim()) {
      errors.closer = "required";
    }

    if (!values.status.trim()) {
      errors.status = "required";
    }

    if (!values.show.trim()) {
      errors.show = "required";
    }

    if (!values.saleDate.trim()) {
      errors.saleDate = "required";
    }

    return errors;
  }

  async function onSubmit(
    values: ValuesCreateSale,
    helpers: FormikHelpers<ValuesCreateSale>
  ) {
    const { setSubmitting } = helpers;

    console.log("YOOOO", values);

    setSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 5000));

  }
  return { australianStates, getTodaysDateFormatted, validate, onSubmit };
}
