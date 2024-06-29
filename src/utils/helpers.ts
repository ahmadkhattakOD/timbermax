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

export function getDateTimeFormattedForField(date?: string | Date) {
  if (date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
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

export enum UserRoles {
  SalesPerson = "Sales Person",
  Closer = "Closer",
  Both = "Sales Person & Closer",
  Admin = "Admin",
}

export const userRoles = [
  UserRoles.SalesPerson,
  UserRoles.Closer,
  UserRoles.Both,
];

export const deleteConfirmationText = "I am sure";

export const extendedDataLimit = 9999999;

export function isRouteAllowed(
  role:
    | UserRoles.Admin
    | UserRoles.Closer
    | UserRoles.Both
    | UserRoles.SalesPerson
    | ""
) {
  if (role === UserRoles.Admin) {
    return true;
  } else if (role === UserRoles.Closer || role === UserRoles.Both) {
    let whiteListedURLs = ["/dashboard", "/close", "/profile"];
    for (let i = 0; i < whiteListedURLs.length; i++) {
      if (window.location.href.includes(whiteListedURLs[i])) {
        return true;
      }
    }
    return false;
  } else if (UserRoles.SalesPerson) {
    let whiteListedURLs = ["/dashboard", "/profile", "/view-sales"];

    for (let i = 0; i < whiteListedURLs.length; i++) {
      if (window.location.href.includes(whiteListedURLs[i])) {
        return true;
      }
    }
    return false;
  }
  return false;
}

export function hasNonEmptyValue(obj: any) {
  // Iterate over all values of the object
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      // Check if the value is not an empty string
      if (value !== "") {
        return true; // Return true if any value is not empty
      }
    }
  }
  return false; // Return false if all values are empty
}

export function getMonthName(date: Date) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = date.getMonth();
  return monthNames[monthIndex];
}

export const opportunityDescriptions = [
  "Electric Bases (Narrow Single)",
  "Electric Bases (Long Single)",
  "Electric Bases (King Single)",
  "Electric Bases (Double)",
  "Electric Bases (Full Queen)",
  "Mattress - Memory Foam (Narrow Single)",
  "Electric Bases (Narrow Single)",
  "Electric Bases (Long Single)",
  "Electric Bases (King Single)",
  "Electric Bases (Double)",
  "Electric Bases (Full Queen)",
  "Mattress - Memory Foam (Narrow Single)",
  "Mattress - Memory Foam (Long Single)",
  "Mattress - Memory Foam (King Single)",
  "Mattress - Memory Foam (Double)",
  "Mattress - Memory Foam (Full Queen)",
  "Mattress - Bodychoice (innerspring) (Narrow Single)",
  "Mattress - Bodychoice (innerspring) (Long Single)",
  "Mattress - Bodychoice (innerspring) (King Single)",
  "Mattress - Bodychoice (innerspring) (Double)",
  "Mattress - Bodychoice (innerspring) (Full Queen)",
];

export function getInitials(name: string) {
  try {
    let initials = "";
    let nameParts = name.split(" ");
    for (let i = 0; i < nameParts.length; i++) {
      initials += nameParts[i][0].toUpperCase();
    }

    return initials;
  } catch (error) {
    return "";
  }
}

export function stripEmail(email: string) {
  return email.split("@")[0];
}

export function formEmail(email: string) {
  const emailRegex = new RegExp(
    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/
  );

  if (emailRegex.test(email)) {
    return email;
  } else {
    return email.split("@")[0] + "@ultramaticreports.com.au";
  }
}
