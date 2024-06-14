export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

export function getDateFormattedForField(date?: string | Date) {
  if (date) {
    return `${new Date(date).getFullYear()}-${(new Date(date).getMonth() + 1).toString().padStart(2, "0")}-${new Date(
      date
    )
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  }
  return `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${new Date()
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

export function getDateFormatted(date?: string | Date) {
  if (date) {
    return `${new Date(date)
      .getDate()
      .toString()
      .padStart(
        2,
        "0"
      )}-${(new Date(date).getMonth() + 1).toString().padStart(2, "0")}-${new Date(date).getFullYear()}`;
  }
  return `${new Date()
    .getDate()
    .toString()
    .padStart(
      2,
      "0"
    )}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${new Date().getFullYear()}`;
}

export function getDateTimeFormatted(date?: string | Date, addSpace?: boolean) {
  if (date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");

    if (addSpace) {
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } else {
      return `${day}-${month}-${year}T${hours}:${minutes}`;
    }
  }
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");

  if (addSpace) {
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } else {
    return `${day}-${month}-${year}T${hours}:${minutes}`;
  }
}

export const initialRowsPerPage = 50;

export const australianStates = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",
];

export const userRoles = ["Sales Person", "Closer", "Both"];

export const deleteConfirmationText = "I am sure";

export const extendedDataLimit = 9999999;
