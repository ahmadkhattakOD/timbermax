import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quotation } from "types";
import { getDateFormatted, formatFullAddress } from "./helpers";
import { BRAND_COLORS } from "themes/theme/default";

// Helper function to load and add logo
const addCompanyLogo = async (
  doc: jsPDF,
  xPosition: number = 14,
  yPosition: number = 20
) => {
  try {
    // Path to the logo - adjust based on your project structure
    // If using Next.js, you might need a different approach
    const logoUrl = "/timber.jpg";

    // If you're running in a browser environment
    if (typeof window !== "undefined") {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise<void>((resolve, reject) => {
        reader.onload = function () {
          const base64 = reader.result as string;
          // Add image to PDF
          doc.addImage(base64, "JPEG", xPosition, yPosition, 45, 22); // Adjust size as needed
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error("Error loading logo:", error);
    // Continue without logo if it fails to load
  }
};

const COMPANY_INFO = {
  name: "TIMBER MAX SUPPLY PTY LTD",
  abn: "95 689 199 773",
  phone: "08 8212 4703",
  email: "info@timbermax.com.au",
  website: "timbermax.com.au",
};

const DISCLAIMER = "* Items marked with an asterisk (*) are GST applicable. All materials supplied are non-returnable and non-refundable. Payment is required by the due date shown on this invoice. Thank you for your business";

// Returns updated Y — adds a new page if the needed space won't fit
const checkAndAddPage = (doc: jsPDF, currentY: number, neededMM: number, topMargin: number = 14): number => {
  const pageHeight = doc.internal.pageSize.height;
  if (currentY + neededMM > pageHeight - 5) {
    doc.addPage();
    return topMargin;
  }
  return currentY;
};

const buildQuotationContent = async (doc: jsPDF, quotation: Quotation) => {
  await addCompanyLogo(doc, 14, 20);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", 105, 45, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_INFO.name, 14, 60);
  doc.text(`ABN: ${COMPANY_INFO.abn}`, 14, 65);
  doc.text(`Phone: ${COMPANY_INFO.phone}`, 14, 70);
  doc.text(`Email: ${COMPANY_INFO.email}`, 14, 75);
  doc.text(`Website: ${COMPANY_INFO.website}`, 14, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`Quotation #: ${quotation.quotation_number}`, 180, 60, { align: "right" });
  doc.text(`Date: ${getDateFormatted(quotation.created_at)}`, 180, 65, { align: "right" });
  const customer = quotation.customers;
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 14, 95);
  doc.setFont("helvetica", "normal");
  doc.text(customer?.name || "N/A", 14, 100);
  const billAddrLines = doc.splitTextToSize(
    formatFullAddress({
      address: quotation.address,
      suburb: quotation.suburb,
      state: quotation.state,
      postCode: quotation.post_code,
    }),
    110,
  );
  doc.text(billAddrLines, 14, 105);
  let billY = 105 + billAddrLines.length * 5;
  doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, billY);
  doc.text(`Email: ${customer?.email || "N/A"}`, 14, billY + 5);

  const items = [...(quotation.quotation_items || [])].sort(
    (a: any, b: any) => (a.sort_order ?? a.id ?? 0) - (b.sort_order ?? b.id ?? 0),
  );
  const tableData = items.map((item: any, index: number) => {
    const quantity = parseFloat(item.quantity);
    const unitPrice = parseFloat(item.unit_price);
    const gst = (item.item_gst ?? item.items?.gst) || false;
    const itemName = (item.item_name ?? item.items?.name) || "N/A";
    return [index + 1, gst ? `${itemName} *` : itemName, quantity.toFixed(2), `$${unitPrice.toFixed(2)}`, `$${(quantity * unitPrice).toFixed(2)}`];
  });

  let totalSubtotal = 0, totalGST = 0, subtotalWithGST = 0;
  items.forEach((item: any) => {
    const qty = parseFloat(item.quantity), price = parseFloat(item.unit_price);
    const sub = qty * price, gstAmt = (item.item_gst ?? item.items?.gst) ? sub * 0.1 : 0;
    totalSubtotal += sub; totalGST += gstAmt; subtotalWithGST += sub + gstAmt;
  });

  const discountRaw = quotation.discount || 0;
  const discountType = (quotation as any).discount_type || "percentage";
  const discountAmount = discountType === "fixed" ? Math.min(discountRaw, subtotalWithGST) : (subtotalWithGST * discountRaw) / 100;
  const grandTotal = subtotalWithGST - discountAmount;

  autoTable(doc, {
    startY: 126,
    head: [["#", "Items", "Qty", "Unit Price", "Total"]],
    body: tableData,
    theme: "grid",
    showHead: "everyPage",
    margin: { top: 14, right: 14, bottom: 5, left: 14 },
    headStyles: { fillColor: BRAND_COLORS.primary as any, textColor: 255 },
    styles: { fontSize: 8, lineColor: BRAND_COLORS.tableBorder as any, textColor: BRAND_COLORS.textDark as any },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 92 }, 2: { cellWidth: 20 }, 3: { cellWidth: 30 }, 4: { cellWidth: 30 } },
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const disclaimerLines = doc.splitTextToSize(DISCLAIMER, 180);
  let postTableY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 6, disclaimerLines.length * 4.5);
  doc.text(disclaimerLines, 14, postTableY);

  const summaryNeeded = 10 + (discountRaw > 0 ? 40 : 30);
  let summaryY = checkAndAddPage(doc, postTableY + disclaimerLines.length * 4.5 + 8, summaryNeeded);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary:", 120, summaryY);
  doc.setFont("helvetica", "normal");
  let currentY = summaryY + 10;
  doc.text("Subtotal:", 120, currentY);
  doc.text(`$${totalSubtotal.toFixed(2)}`, 180, currentY, { align: "right" });
  currentY += 10;
  doc.text("GST:", 120, currentY);
  doc.text(`$${totalGST.toFixed(2)}`, 180, currentY, { align: "right" });
  if (discountRaw > 0) {
    currentY += 10;
    const lbl = discountType === "fixed" ? `Discount ($${discountRaw.toFixed(2)}):` : `Discount (${discountRaw}%):`;
    doc.text(lbl, 120, currentY);
    doc.text(`-$${discountAmount.toFixed(2)}`, 180, currentY, { align: "right" });
  }
  currentY += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", 120, currentY);
  doc.text(`$${grandTotal.toFixed(2)}`, 180, currentY, { align: "right" });

  let bankY = checkAndAddPage(doc, currentY + 12, 35);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Bank Details:", 14, bankY);
  doc.setFont("helvetica", "normal");
  doc.text("Bank Detail: Commonwealth Bank", 14, bankY + 7);
  doc.text("Account Name: Timbermax Supply Pty Ltd", 14, bankY + 14);
  doc.text("BSB No: 065 167", 14, bankY + 21);
  doc.text("Account Number: 1056 5353", 14, bankY + 28);

  if (quotation.note) {
    const splitNotes = doc.splitTextToSize(quotation.note, 180);
    let notesY = checkAndAddPage(doc, bankY + 34, splitNotes.length * 4.5 + 12);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 14, notesY);
    doc.setFont("helvetica", "normal");
    doc.text(splitNotes, 14, notesY + 6);
  }
};

export const generateAndDownloadQuotationPDF = async (
  quotation: Quotation
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();
    await buildQuotationContent(doc, quotation);
    const fileName = `quotation_${quotation.quotation_number}_${getDateFormatted(new Date().toISOString())}.pdf`;
    doc.save(fileName);
    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return { success: false, error: error.message };
  }
};

const buildDeliveryContent = async (doc: jsPDF, quotation: Quotation) => {
  await addCompanyLogo(doc, 14, 20);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("DELIVERY NOTE", 105, 45, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_INFO.name, 14, 60);
  doc.text(`ABN: ${COMPANY_INFO.abn}`, 14, 65);
  doc.text(`Phone: ${COMPANY_INFO.phone}`, 14, 70);
  doc.text(`Email: ${COMPANY_INFO.email}`, 14, 75);
  doc.text(`Website: ${COMPANY_INFO.website}`, 14, 80);
  doc.text(`Delivery Note #: ${quotation.quotation_number}-DEL`, 180, 60, { align: "right" });
  doc.text(`Date: ${getDateFormatted(new Date().toISOString())}`, 180, 65, { align: "right" });
  doc.text(`Quotation #: ${quotation.quotation_number}`, 180, 70, { align: "right" });

  const customer = quotation.customers as any;
  doc.setFont("helvetica", "bold");
  doc.text("DELIVER TO:", 14, 100);
  doc.setFont("helvetica", "normal");
  doc.text(customer?.name || "N/A", 14, 105);
  const delAddrLines = doc.splitTextToSize(
    formatFullAddress({
      address: quotation.address,
      suburb: quotation.suburb,
      state: quotation.state,
      postCode: quotation.post_code,
    }),
    110,
  );
  doc.text(delAddrLines, 14, 110);
  doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 110 + delAddrLines.length * 5);

  const items = [...(quotation.quotation_items || [])].sort(
    (a: any, b: any) => (a.sort_order ?? a.id ?? 0) - (b.sort_order ?? b.id ?? 0),
  );
  const tableData = items.map((item: any, index: number) => {
    const qty = parseFloat(item.quantity);
    const gst = (item.item_gst ?? item.items?.gst) || false;
    const name = (item.item_name ?? item.items?.name) || "N/A";
    return [index + 1, gst ? `${name} *` : name, qty.toFixed(2), ""];
  });

  autoTable(doc, {
    startY: 126,
    head: [["#", "Item Description", "Quantity", "Received"]],
    body: tableData,
    theme: "grid",
    showHead: "everyPage",
    margin: { top: 14, right: 14, bottom: 5, left: 14 },
    headStyles: { fillColor: BRAND_COLORS.primary as any, textColor: 255 },
    styles: { fontSize: 8, lineColor: BRAND_COLORS.tableBorder as any, textColor: BRAND_COLORS.textDark as any },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 102 }, 2: { cellWidth: 30 }, 3: { cellWidth: 40 } },
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const disclaimerLines = doc.splitTextToSize(DISCLAIMER, 180);
  let finalY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 6, disclaimerLines.length * 4.5);
  doc.text(disclaimerLines, 14, finalY);

  let bankY = checkAndAddPage(doc, finalY + disclaimerLines.length * 4.5 + 5, 35);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Bank Details:", 14, bankY);
  doc.setFont("helvetica", "normal");
  doc.text("Bank Detail: Commonwealth Bank", 14, bankY + 7);
  doc.text("Account Name: Timbermax Supply Pty Ltd", 14, bankY + 14);
  doc.text("BSB No: 065 167", 14, bankY + 21);
  doc.text("Account Number: 1056 5353", 14, bankY + 28);

  let noteY = bankY + 32;
  if (quotation.note) {
    const splitNotes = doc.splitTextToSize(quotation.note, 180);
    noteY = checkAndAddPage(doc, noteY, splitNotes.length * 4.5 + 12);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 14, noteY);
    doc.setFont("helvetica", "normal");
    doc.text(splitNotes, 14, noteY + 6);
    noteY += splitNotes.length * 4.5 + 8;
  }

  let sigY = checkAndAddPage(doc, noteY + 8, 28);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER SIGNATURE:", 14, sigY);
  doc.line(14, sigY + 5, 100, sigY + 5);
  doc.setFont("helvetica", "normal");
  doc.text("Name: ____________________", 14, sigY + 10);
  doc.text("Date: ____________________", 14, sigY + 16);
  doc.setFont("helvetica", "bold");
  doc.text("DELIVERY PERSON:", 120, sigY);
  doc.line(120, sigY + 5, 180, sigY + 5);
  doc.setFont("helvetica", "normal");
  doc.text("Name: ____________________", 120, sigY + 10);
  doc.text("Date: ____________________", 120, sigY + 16);
};

export const generateAndDownloadDeliveryDocument = async (
  quotation: Quotation
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();
    await buildDeliveryContent(doc, quotation);
    const fileName = `delivery_${quotation.quotation_number}_${getDateFormatted(new Date().toISOString())}.pdf`;
    doc.save(fileName);
    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating delivery document:", error);
    return { success: false, error: error.message };
  }
};

// Compressed quotation PDF (no logo) for email attachment
export const generateQuotationPDFBase64 = async (
  quotation: Quotation
): Promise<{ success: boolean; base64?: string; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();
    const customer = (quotation.customers || (quotation as any).customer) as any;

    // Header — text only, no logo
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", 105, 20, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("TIMBER MAX SUPPLY PTY LTD", 14, 32);
    doc.text("ABN: 95 688 199 773", 14, 37);
    doc.text("Phone: 08 8212 4703 | Email: info@timbermax.com.au", 14, 42);

    doc.text(`Quotation #: ${quotation.quotation_number}`, 196, 32, { align: "right" });
    doc.text(`Date: ${getDateFormatted(quotation.created_at)}`, 196, 37, { align: "right" });
    if ((quotation as any).valid_until) {
      doc.text(`Valid Until: ${getDateFormatted((quotation as any).valid_until)}`, 196, 42, { align: "right" });
    }

    // Divider
    doc.setDrawColor(156, 106, 58);
    doc.setLineWidth(0.5);
    doc.line(14, 46, 196, 46);

    // Bill To
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 54);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 59);
    const fullAddress = formatFullAddress({
      address: quotation.address,
      suburb: quotation.suburb,
      state: quotation.state,
      postCode: quotation.post_code,
    });
    const addressParts = [
      ...(fullAddress ? (doc.splitTextToSize(fullAddress, 120) as string[]) : []),
      customer?.email ? `Email: ${customer.email}` : null,
      customer?.phone ? `Phone: ${customer.phone}` : null,
    ].filter(Boolean);
    let addrY = 64;
    addressParts.forEach((line) => {
      doc.text(line as string, 14, addrY);
      addrY += 4.5;
    });

    // Items table
    const items = [...(quotation.quotation_items || [])].sort(
      (a: any, b: any) =>
        (a.sort_order ?? a.id ?? 0) - (b.sort_order ?? b.id ?? 0),
    );
    const tableData = items.map((item: any, index: number) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const gst = (item.item_gst ?? item.items?.gst) || false;
      const name = (item.item_name ?? item.items?.name) || "N/A";
      return [
        index + 1,
        gst ? `${name} *` : name,
        qty.toFixed(2),
        `$${price.toFixed(2)}`,
        `$${(qty * price).toFixed(2)}`,
      ];
    });

    let totalSubtotal = 0;
    let totalGST = 0;
    let subtotalWithGST = 0;
    items.forEach((item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const sub = qty * price;
      const gstAmt = (item.item_gst ?? item.items?.gst) ? sub * 0.1 : 0;
      totalSubtotal += sub;
      totalGST += gstAmt;
      subtotalWithGST += sub + gstAmt;
    });

    const discountRaw2 = (quotation as any).discount || 0;
    const discountType2: "percentage" | "fixed" = (quotation as any).discount_type || "percentage";
    const discountAmount = discountType2 === "fixed"
      ? Math.min(discountRaw2, subtotalWithGST)
      : (subtotalWithGST * discountRaw2) / 100;
    const grandTotal = subtotalWithGST - discountAmount;

    autoTable(doc, {
      startY: addrY + 4,
      head: [["#", "Items", "Qty", "Unit Price", "Total"]],
      body: tableData,
      theme: "grid",
      showHead: "everyPage",
      margin: { top: 14, right: 14, bottom: 5, left: 14 },
      headStyles: { fillColor: [156, 106, 58], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
    });

    // Disclaimer — only add page if the disclaimer itself won't fit
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    const gstDisclaimerLines = doc.splitTextToSize(
      DISCLAIMER,
      180,
    );
    let finalY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 5, gstDisclaimerLines.length * 4.5);
    doc.text(gstDisclaimerLines, 14, finalY);

    // Totals — only add page if totals block won't fit
    finalY = checkAndAddPage(doc, finalY + gstDisclaimerLines.length * 4.5 + 4, discountRaw2 > 0 ? 36 : 26);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 140, finalY);
    doc.text(`$${totalSubtotal.toFixed(2)}`, 196, finalY, { align: "right" });
    finalY += 5;
    doc.text("GST:", 140, finalY);
    doc.text(`$${totalGST.toFixed(2)}`, 196, finalY, { align: "right" });
    if (discountRaw2 > 0) {
      finalY += 5;
      const discountLabel2 = discountType2 === "fixed"
        ? `Discount ($${discountRaw2.toFixed(2)}):`
        : `Discount (${discountRaw2}%):`;
      doc.text(discountLabel2, 140, finalY);
      doc.text(`-$${discountAmount.toFixed(2)}`, 196, finalY, { align: "right" });
    }
    finalY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 140, finalY);
    doc.text(`$${grandTotal.toFixed(2)}`, 196, finalY, { align: "right" });

    // Bank Details — only add page if the 4 bank lines won't fit (~30mm)
    finalY = checkAndAddPage(doc, finalY + 8, 30);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    finalY += 5;
    doc.text("Bank Detail: Commonwealth Bank", 14, finalY);
    finalY += 4.5;
    doc.text("Account Name: Timbermax Supply Pty Ltd", 14, finalY);
    finalY += 4.5;
    doc.text("BSB No: 065 167", 14, finalY);
    finalY += 4.5;
    doc.text("Account Number: 1056 5353", 14, finalY);

    if (quotation.note) {
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      finalY = checkAndAddPage(doc, finalY + 10, splitNotes.length * 4.5 + 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, finalY);
      doc.setFont("helvetica", "normal");
      finalY += 4;
      doc.text(splitNotes, 14, finalY);
    }

    const fileName = `quotation_${quotation.quotation_number}.pdf`;
    const base64 = doc.output("datauristring");

    return { success: true, base64, fileName };
  } catch (error: any) {
    console.error("Error generating compressed quotation PDF:", error);
    return { success: false, error: error.message };
  }
};

export const openQuotationPDFInNewTab = async (
  quotation: Quotation
): Promise<void> => {
  const doc = new jsPDF();
  await buildQuotationContent(doc, quotation);
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
};

const openBlobAndPrint = (doc: any) => {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const win = window.open(url);
  if (win) {
    win.addEventListener("load", () => {
      setTimeout(() => win.print(), 250);
    });
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

export const printQuotationPDF = async (
  quotation: Quotation,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const doc = new jsPDF();
    await buildQuotationContent(doc, quotation);
    openBlobAndPrint(doc);
    return { success: true };
  } catch (error: any) {
    console.error("Error printing quotation PDF:", error);
    return { success: false, error: error.message };
  }
};

export const printQuotationDeliveryNote = async (
  quotation: Quotation,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const doc = new jsPDF();
    await buildDeliveryContent(doc, quotation);
    openBlobAndPrint(doc);
    return { success: true };
  } catch (error: any) {
    console.error("Error printing quotation delivery note:", error);
    return { success: false, error: error.message };
  }
};
// ==================== CUSTOMER QUOTATION REPORT PDF ====================

export interface QuotationReportPdfData {
  customerName: string;
  customerId: number;
  rangeLabel: string;
  summary: {
    count: number;
    grandTotal: number;
    subtotalTotal: number;
    gstTotal: number;
    approvedTotal: number;
    approvedCount: number;
    pendingTotal: number;
    pendingCount: number;
    convertedTotal: number;
    convertedCount: number;
    cancelledTotal: number;
    cancelledCount: number;
    itemsTotal: number;
    byStatus: Record<string, { count: number; total: number }>;
  };
  rows: any[];
}

const capQuote = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export const generateCustomerQuotationReportPDF = async (
  report: QuotationReportPdfData,
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();
    await addCompanyLogo(doc, 14, 20);

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER QUOTATION STATEMENT", 105, 45, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_INFO.name, 14, 60);
    doc.text(`ABN: ${COMPANY_INFO.abn}`, 14, 65);
    doc.text(`Phone: ${COMPANY_INFO.phone}`, 14, 70);
    doc.text(`Email: ${COMPANY_INFO.email}`, 14, 75);

    doc.setFont("helvetica", "bold");
    doc.text(`Customer: ${report.customerName || "N/A"}`, 196, 60, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${report.rangeLabel}`, 196, 65, { align: "right" });
    doc.text(`Generated: ${getDateFormatted(new Date())}`, 196, 70, {
      align: "right",
    });

    const s = report.summary;
    doc.setDrawColor(...(BRAND_COLORS.tableBorder as [number, number, number]));
    doc.setFillColor(253, 246, 239);
    doc.roundedRect(14, 88, 182, 26, 2, 2, "FD");

    const summaryCells: [string, string][] = [
      ["Total Quoted", `$${s.grandTotal.toFixed(2)}`],
      ["Approved Value", `$${s.approvedTotal.toFixed(2)} (${s.approvedCount})`],
      ["Pending Value", `$${s.pendingTotal.toFixed(2)} (${s.pendingCount})`],
      ["Quotations / Items", `${s.count} (${s.itemsTotal} items)`],
    ];
    const colW = 182 / 4;
    summaryCells.forEach((cell, i) => {
      const x = 14 + colW * i + 4;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.text(cell[0], x, 96);
      doc.setFontSize(12);
      doc.setTextColor(...(BRAND_COLORS.primary as [number, number, number]));
      doc.setFont("helvetica", "bold");
      doc.text(cell[1], x, 104);
    });
    doc.setTextColor(...(BRAND_COLORS.textDark as [number, number, number]));

    const tableData = report.rows.map((q: any) => [
      q.quotation_number ?? "",
      getDateFormatted(q.created_at),
      capQuote(q.status ?? ""),
      String(q.quotation_items?.length || 0),
      `$${(Number(q.total) || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 120,
      head: [["Quotation No.", "Quotation Date", "Status", "Items", "Quotation Total"]],
      body: tableData,
      foot: [
        [
          { content: "Total", colSpan: 4, styles: { halign: "right" } } as any,
          `$${s.grandTotal.toFixed(2)}`,
        ],
      ],
      theme: "grid",
      showHead: "everyPage",
      margin: { top: 14, right: 14, bottom: 12, left: 14 },
      headStyles: {
        fillColor: BRAND_COLORS.primary as any,
        textColor: 255,
        fontSize: 8,
      },
      footStyles: {
        fillColor: [245, 240, 235] as any,
        textColor: BRAND_COLORS.textDark as any,
        fontStyle: "bold",
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        lineColor: BRAND_COLORS.tableBorder as any,
        textColor: BRAND_COLORS.textDark as any,
      },
      columnStyles: {
        0: { cellWidth: 36 },
        3: { halign: "center" },
        4: { halign: "right" },
      },
    });

    // Subtotal / GST / Grand Total breakdown (right-aligned)
    let totalsY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 8, 24);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 140, totalsY);
    doc.text(`$${s.subtotalTotal.toFixed(2)}`, 196, totalsY, { align: "right" });
    totalsY += 6;
    doc.text("GST:", 140, totalsY);
    doc.text(`$${s.gstTotal.toFixed(2)}`, 196, totalsY, { align: "right" });
    totalsY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 140, totalsY);
    doc.text(`$${s.grandTotal.toFixed(2)}`, 196, totalsY, { align: "right" });

    let finalY = checkAndAddPage(doc, totalsY + 8, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Cancelled quotations are excluded from this statement. Cancelled total: $${s.cancelledTotal.toFixed(
        2,
      )} across ${s.cancelledCount} quotations. Converted: $${s.convertedTotal.toFixed(
        2,
      )} across ${s.convertedCount} quotations.`,
      14,
      finalY,
    );

    // Bank Details — same block as a normal quotation; new page if it won't fit
    let bankY = checkAndAddPage(doc, finalY + 12, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 14, bankY);
    doc.setFont("helvetica", "normal");
    doc.text("Bank Detail: Commonwealth Bank", 14, bankY + 7);
    doc.text("Account Name: Timbermax Supply Pty Ltd", 14, bankY + 14);
    doc.text("BSB No: 065 167", 14, bankY + 21);
    doc.text("Account Number: 1056 5353", 14, bankY + 28);
    doc.text("Reference: " + (report.customerName || "N/A"), 14, bankY + 35);

    const fileName = `report_quotations_customer_${
      report.customerId
    }_${getDateFormatted(new Date()).replace(/-/g, "")}.pdf`;
    doc.save(fileName);
    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating quotation report PDF:", error);
    return { success: false, error: error.message };
  }
};
