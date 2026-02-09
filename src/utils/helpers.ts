import { useRef } from "react";

export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

export function getDateFormattedForField(date?: string | Date) {
  if (date) {
    return `${new Date(date).getFullYear()}-${(new Date(date).getMonth() + 1).toString().padStart(2, "0")}-${new Date(
      date,
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
        "0",
      )}-${(new Date(date).getMonth() + 1).toString().padStart(2, "0")}-${new Date(date).getFullYear()}`;
  }
  return `${new Date()
    .getDate()
    .toString()
    .padStart(
      2,
      "0",
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
  SuperAdmin = "Super Admin",
  WarehouseOperator = "Warehouse Operator",
}

export const userRoles = [
  UserRoles.SuperAdmin,
  UserRoles.Admin,
  UserRoles.WarehouseOperator,
];

export const deleteConfirmationText = "I am sure";

export const extendedDataLimit = 999999;

export function isRouteAllowed(
  role:
    | UserRoles.Admin
    | UserRoles.SuperAdmin
    | UserRoles.WarehouseOperator
    | "",
) {
  // TODO: fix and uncomment this
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
  } else if (role === UserRoles.WarehouseOperator) {
    let whiteListedURLs = ["/items", "/stock", "/warehouses", "/profile"];
    for (let i = 0; i < whiteListedURLs.length; i++) {
      if (window.location.href.includes(whiteListedURLs[i])) {
        return true;
      }
    }
    return false;
  }
  return true;
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

export const calculateItemTotal = (item: any) => {
  const qty = parseFloat(item.quantity);
  const price = parseFloat(item.unit_price);

  const baseTotal = qty * price;

  return baseTotal;
};

export const calculateSubTotal = (item: any) => {
  const qty = parseFloat(item.quantity);
  const price = parseFloat(item.unit_price);

  const baseTotal = qty * price;
  const gstAmount = item.gst ? baseTotal * 0.1 : 0;

  return baseTotal + gstAmount;
};

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
    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/,
  );

  if (emailRegex.test(email)) {
    return email;
  } else {
    return email.split("@")[0] + "@ultramaticreports.com.au";
  }
}

export const useDebouncedSearch = (
  callback: Function,
  delay: number = 1000,
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

export interface ParsedAddress {
  street: string;
  suburb: string;
  state: string;
  postCode: string;
  country: string;
}

export function parseAddress2(fullAddress: string): ParsedAddress {
  if (!fullAddress) {
    return { street: '', suburb: '', state: '', postCode: '', country: '' };
  }

  const parts = fullAddress.split(',').map(part => part.trim());
  
  // Default values
  const result: ParsedAddress = {
    street: '',
    suburb: '',
    state: '',
    postCode: '',
    country: 'Australia'
  };

  // Australian address parsing logic
  if (parts.length >= 1) result.street = parts[0];
  if (parts.length >= 2) result.suburb = parts[1];
  
  // Handle state and postcode (usually last parts)
  if (parts.length >= 3) {
    const lastParts = parts[parts.length - 1].split(' ');
    if (lastParts.length >= 2) {
      // Assuming format like "VIC 3000" or "NSW 2000"
      result.state = lastParts[0];
      result.postCode = lastParts[1];
    }
  }

  return result;
}

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
  const underscoreIndex = fileUrl.lastIndexOf("_");
  const dotIndex = fileUrl.lastIndexOf(".");

  if (underscoreIndex !== -1 && dotIndex !== -1 && dotIndex > underscoreIndex) {
    const baseName = fileUrl.substring(0, underscoreIndex);
    const extension = fileUrl.substring(dotIndex);
    const newFileName = `${baseName}${extension}`;
    return newFileName;
  }
};

export const getYearsArray = () => {
  let startYear = 2023;
  const currentYear = new Date().getFullYear();

  const yearsArray = [];
  for (let year = currentYear; year >= startYear; year--) {
    yearsArray.push(year);
  }

  return yearsArray;
};

//helper function to normalize string since some of the values were not matching with old code that's commented out below
export const normalizeString = (str: string) =>
  str.normalize("NFKC").replace(/\s+/g, " ").trim();
