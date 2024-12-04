import { useRef } from "react";

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
  SuperAdmin = "SuperAdmin",
}

export const userRoles = [
  UserRoles.SalesPerson,
  UserRoles.Closer,
  UserRoles.Both,
];

export const deleteConfirmationText = "I am sure";

export const extendedDataLimit = 999999;

export function isRouteAllowed(
  role:
    | UserRoles.Admin
    | UserRoles.SuperAdmin
    | UserRoles.Closer
    | UserRoles.Both
    | UserRoles.SalesPerson
    | ""
) {
  if (role === UserRoles.SuperAdmin) {
    return true;
  } else if (role === UserRoles.Admin) {
    let blackListedURLs = ["/user"];

    for (let i = 0; i < blackListedURLs.length; i++) {
      if (window.location.href.includes(blackListedURLs[i])) {
        return false;
      }
    }
    return true;
  } else if (role === UserRoles.Closer || role === UserRoles.Both) {
    let whiteListedURLs = ["/dashboard", "/close", "/profile", "view-invoices"];
    for (let i = 0; i < whiteListedURLs.length; i++) {
      if (window.location.href.includes(whiteListedURLs[i])) {
        return true;
      }
    }
    return false;
  } else if (UserRoles.SalesPerson) {
    let whiteListedURLs = [
      "/dashboard",
      "/profile",
      "/view-sales",
      "view-invoices",
    ];

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
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value !== "") {
        return true;
      }
    }
  }
  return false; 
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

export const useDebouncedSearch = (
  callback: Function,
  delay: number = 1000
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

export const stateAbbreviations = {
  ACT: "Australian Capital Territory",
  NSW: "New South Wales",
  NT: "Northern Territory",
  QLD: "Queensland",
  SA: "South Australia",
  TAS: "Tasmania",
  VIC: "Victoria",
  WA: "Western Australia",
};

export function parseAddress(address: string): {
  streetAddress: string;
  suburb: string;
  state: string;
  country: string;
} {
  let streetAddress = "";
  let suburb = "";
  let state = "";
  let country = "";

  try {
    const parts = address.split(",");
    const trimmedParts = parts.map((part) => part.trim());
    country = trimmedParts.pop() as string;
    const suburbAndState = trimmedParts.pop() as string;
    const stateMatch = suburbAndState.match(/(.*)\s(\S+)\s*$/);
    if (stateMatch) {
      suburb = stateMatch[1].trim();
      state = stateMatch[2].trim();
    }

    state =
      stateAbbreviations[
        state as "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA"
      ];

    streetAddress = trimmedParts.join(", ");

    return {
      streetAddress,
      suburb,
      state,
      country,
    };
  } catch (e) {
    return {
      streetAddress,
      suburb,
      state,
      country,
    };
  }
}

export const confirmFileSize = (file: File, limit: number = 5) => {
  const maxSizeInBytes = limit * 1000 * 1000;
  return file.size <= maxSizeInBytes;
};

export const acceptedFileTypes = [
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
  ".csv",
  ".xlsx",
  ".doc",
  ".docx",
  ".txt",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".rtf",
];

export const downloadFile = async (fileUrl: string, fileName: string) => {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "download";

  document.body.appendChild(link);

  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
};

export const cleanFileName = (fileUrl: string) => {
  const underscoreIndex = fileUrl.lastIndexOf('_');
  const dotIndex = fileUrl.lastIndexOf('.');

  if (underscoreIndex !== -1 && dotIndex !== -1 && dotIndex > underscoreIndex) {
    const baseName = fileUrl.substring(0, underscoreIndex);
    const extension = fileUrl.substring(dotIndex);
    const newFileName = `${baseName}${extension}`;
    return newFileName;
  }
};
