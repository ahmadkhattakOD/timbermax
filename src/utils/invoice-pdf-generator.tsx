import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BRAND_COLORS } from "themes/theme/default";
import { getDateFormatted, formatFullAddress, formatAmount } from "utils/helpers";
import { Invoice } from "types";

// ==================== PDF SIZE / IMAGE COMPRESSION LAYER ====================
// EmailJS rejects attachments larger than 500 KB. To keep every generated PDF
// comfortably under that limit we (1) downscale + re-encode embedded images to
// the exact box they're drawn in, and (2) enable jsPDF stream compression on
// every document. None of this changes how the PDF looks.

// Max attachment size EmailJS allows (500 KB)
const MAX_ATTACHMENT_BYTES = 500 * 1024;

// Decoded byte length of a base64 payload (ignores any data-uri prefix)
const base64ByteLength = (base64: string): number => {
  const data = base64.includes(",") ? base64.split(",")[1] : base64;
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return Math.floor((data.length * 3) / 4) - padding;
};

const mmToPx = (mm: number, dpi: number) => Math.max(1, Math.round((mm / 25.4) * dpi));

// Loads an image and returns a downscaled / re-compressed data URL sized for the
// box it will occupy in the PDF. Shrinks the embedded image bytes dramatically
// without altering its on-page appearance (same box, same stretch).
const loadCompressedImage = async (
  url: string,
  boxWidthMm: number,
  boxHeightMm: number,
  format: "JPEG" | "PNG",
  quality = 0.82,
  dpi = 150,
): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const pxW = mmToPx(boxWidthMm, dpi);
    const pxH = mmToPx(boxHeightMm, dpi);
    const canvas = document.createElement("canvas");
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, pxW, pxH);
    bitmap.close?.();
    const mime = format === "PNG" ? "image/png" : "image/jpeg";
    return canvas.toDataURL(mime, quality);
  } catch (error) {
    console.error("Error compressing image:", url, error);
    return null;
  }
};

// Helper function to load and add logo (same as quotation example)
const addCompanyLogo = async (
  doc: jsPDF,
  xPosition: number = 14,
  yPosition: number = 20,
) => {
  try {
    // Downscaled + re-encoded to the 45x22mm box it's drawn in (keeps PDF small)
    const dataUrl = await loadCompressedImage("/timber.jpg", 45, 22, "JPEG", 0.85, 150);
    if (dataUrl) {
      doc.addImage(dataUrl, "JPEG", xPosition, yPosition, 45, 22);
    }
  } catch (error) {
    console.error("Error loading logo:", error);
    // Continue without logo if it fails to load
  }
};

// Constants for consistent company branding
const COMPANY_INFO = {
  name: "TIMBER MAX SUPPLY PTY LTD",
  abn: "95 689 199 773",
  phone: "08 8212 4703",
  email: "info@timbermax.com.au",
  website: "timbermax.com.au",
};

// Adds a "PAID" stamp image to the bottom-right of the page.
// dpi can be lowered to shrink the embedded stamp when fitting an email budget.
const addPaidStampImage = async (doc: jsPDF, dpi: number = 150) => {
  try {
    // PNG keeps the stamp's transparency; downscaled to the 60x60mm draw box
    const dataUrl = await loadCompressedImage("/paid.png", 60, 60, "PNG", 1, dpi);
    if (dataUrl) {
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const stampWidth = 60;
      const stampHeight = 60;
      const x = pageWidth - stampWidth - 10;
      const y = pageHeight - stampHeight - 10;
      doc.addImage(dataUrl, "PNG", x, y, stampWidth, stampHeight);
    }
  } catch (error) {
    console.error("Error loading paid stamp:", error);
  }
};

// Returns updated Y — adds a new page if the needed space won't fit
const checkAndAddPage = (doc: jsPDF, currentY: number, neededMM: number, topMargin: number = 14): number => {
  const pageHeight = doc.internal.pageSize.height;
  if (currentY + neededMM > pageHeight - 5) {
    doc.addPage();
    return topMargin;
  }
  return currentY;
};

// Shared helper that builds invoice PDF content onto a jsPDF doc
const buildInvoicePDF = async (doc: jsPDF, invoice: Invoice) => {
  await addCompanyLogo(doc, 14, 20);

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 105, 45, { align: "center" });

  // Company Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_INFO.name, 14, 60);
  doc.text(`ABN: ${COMPANY_INFO.abn}`, 14, 65);
  doc.text(`Phone: ${COMPANY_INFO.phone}`, 14, 70);
  doc.text(`Email: ${COMPANY_INFO.email}`, 14, 75);
  doc.text(`Website: ${COMPANY_INFO.website}`, 14, 80);

  // Invoice Info (right aligned)
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ${invoice.invoice_number}`, 180, 60, {
    align: "right",
  });
  doc.text(`Date: ${getDateFormatted(invoice.invoice_date)}`, 180, 65, {
    align: "right",
  });
  if ((invoice as any).due_date) {
    doc.text(
      `Due Date: ${getDateFormatted((invoice as any).due_date)}`,
      180,
      70,
      {
        align: "right",
      },
    );
  }
  // if ((invoice as any).created_at) {
  //   doc.text(
  //     `Created: ${getDateFormatted((invoice as any).created_at)}`,
  //     180,
  //     75,
  //     {
  //       align: "right",
  //     },
  //   );
  // }
  // doc.text(`Status: ${invoice.status?.toUpperCase()}`, 180, 80, {
  //   align: "right",
  // });
  // if (invoice.delivery_status) {
  //   doc.text(`Delivery: ${invoice.delivery_status?.toUpperCase()}`, 180, 85, {
  //     align: "right",
  //   });
  // }
  if ((invoice as any).quotations?.quotation_number) {
    doc.text(
      `Ref Quote: ${(invoice as any).quotations.quotation_number}`,
      180,
      75,
      {
        align: "right",
      },
    );
  }

  // Customer Info
  const customer = invoice.customer;
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 14, 100);
  doc.setFont("helvetica", "normal");
  doc.text(customer?.name || "N/A", 14, 106);
  const billAddrLines = doc.splitTextToSize(
    formatFullAddress({
      address: invoice.address,
      suburb: invoice.suburb,
      state: invoice.state,
      postCode: invoice.post_code,
    }),
    110,
  );
  doc.text(billAddrLines, 14, 111);
  const addrEndY = 111 + billAddrLines.length * 5;
  doc.text(
    `Phone: ${customer?.phone || customer?.mobile || "N/A"}`,
    14,
    addrEndY,
  );
  doc.text(`Email: ${customer?.email || "N/A"}`, 14, addrEndY + 7);

  // Items Table
  const items = [...(invoice.invoice_items || [])].sort(
    (a: any, b: any) =>
      (a.sort_order ?? a.id ?? 0) - (b.sort_order ?? b.id ?? 0),
  );
  const tableData = items.map((item: any, index: number) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const subtotal = quantity * unitPrice;
    const gst = (item.item_gst ?? item.items?.gst) || false;

    const itemName = (item.item_name ?? item.items?.name) || "N/A";
    const itemNameWithGst = gst ? `${itemName} *` : itemName;
    const itemCell = item.note
      ? `${itemNameWithGst}\nNote: ${item.note}`
      : itemNameWithGst;

    return [
      index + 1,
      itemCell,
      quantity.toFixed(2),
      `$${unitPrice.toFixed(2)}`,
      `$${subtotal.toFixed(2)}`,
    ];
  });

  // Calculate totals
  let totalSubtotal = 0;
  let totalGST = 0;
  let subtotalWithGST = 0;

  items.forEach((item: any) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const subtotal = quantity * unitPrice;
    const gst = (item.item_gst ?? item.items?.gst) || false;
    const gstAmount = gst ? subtotal * 0.1 : 0;

    totalSubtotal += subtotal;
    totalGST += gstAmount;
    subtotalWithGST += subtotal + gstAmount;
  });

  const discountType = (invoice as any).discount_type || "percentage";
  const discountRaw = invoice.discount || 0;
  const discountAmount =
    discountType === "fixed"
      ? Math.min(discountRaw, subtotalWithGST)
      : (subtotalWithGST * discountRaw) / 100;
  const grandTotal = subtotalWithGST - discountAmount;
  const depositPaid = Number((invoice as any).deposit) || 0;
  const totalDue = Math.max(0, grandTotal - depositPaid);

  autoTable(doc, {
    startY: addrEndY + 10,
    head: [["#", "Items", "Qty", "Unit Price", "Total"]],
    body: tableData,
    theme: "grid",
    showHead: "everyPage",
    margin: { top: 14, right: 14, bottom: 8, left: 14 },
    headStyles: {
      fillColor: BRAND_COLORS.primary as any,
      textColor: 255,
    },
    styles: {
      fontSize: 8,
      lineColor: BRAND_COLORS.tableBorder as any,
      textColor: BRAND_COLORS.textDark as any,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 92 },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
    },
  });

  // Disclaimer — only add page if this line itself won't fit
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const disclaimerText =
    "* Items marked with an asterisk (*) are GST applicable. All materials supplied are non-returnable and non-refundable. Payment is required by the due date shown on this invoice. Thank you for your business";
  const disclaimerLines = doc.splitTextToSize(disclaimerText, 180);
  let postTableY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 6, disclaimerLines.length * 5);
  doc.text(disclaimerLines, 14, postTableY);

  // Summary Section — only add page if summary block won't fit (header + 4 rows = ~50mm)
  const summaryNeeded = 10 + (discountRaw > 0 ? 40 : 30);
  let summaryY = checkAndAddPage(doc, postTableY + disclaimerLines.length * 5 + 8, summaryNeeded);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary:", 120, summaryY);

  doc.setFont("helvetica", "normal");
  let currentY = summaryY + 10;

  doc.text(`Subtotal:`, 120, currentY);
  doc.text(`$${totalSubtotal.toFixed(2)}`, 180, currentY, { align: "right" });

  currentY += 10;
  doc.text(`GST:`, 120, currentY);
  doc.text(`$${totalGST.toFixed(2)}`, 180, currentY, { align: "right" });

  if (discountRaw > 0) {
    currentY += 10;
    const discountLabel =
      discountType === "fixed"
        ? `Discount ($${formatAmount(discountRaw)}):`
        : `Discount (${formatAmount(discountRaw)}%):`;
    doc.text(discountLabel, 120, currentY);
    doc.text(`-$${discountAmount.toFixed(2)}`, 180, currentY, {
      align: "right",
    });
  }

  currentY += 10;
  doc.setFont("helvetica", "bold");
  doc.text(`Total:`, 120, currentY);
  doc.text(`$${totalDue.toFixed(2)}`, 180, currentY, { align: "right" });

  // Bank Details — only add page if the 5 bank lines won't fit (~42mm)
  let bankY = checkAndAddPage(doc, currentY + 12, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Bank Details:", 14, bankY);
  doc.setFont("helvetica", "normal");
  doc.text("Bank Detail: Commonwealth Bank", 14, bankY + 7);
  doc.text("Account Name: Timbermax Supply Pty Ltd", 14, bankY + 14);
  doc.text("BSB No: 065 167", 14, bankY + 21);
  doc.text("Account Number: 1056 5353", 14, bankY + 28);
  doc.text("Reference: " + invoice.invoice_number, 14, bankY + 35);

  // Notes — only add page if notes themselves won't fit
  if (invoice.note) {
    const splitNotes = doc.splitTextToSize(invoice.note, 180);
    let notesY = checkAndAddPage(doc, bankY + 42, splitNotes.length * 5 + 10);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 14, notesY);
    doc.setFont("helvetica", "normal");
    doc.text(splitNotes, 14, notesY + 6);
  }

  // Paid stamp overlay
  if (invoice.status === "paid") {
    await addPaidStampImage(doc);
  }
};

export const generateAndDownloadInvoicePDF = async (
  invoice: Invoice,
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF({ compress: true });
    await buildInvoicePDF(doc, invoice);

    const fileName = `invoice_${invoice.invoice_number}_${getDateFormatted(
      new Date().toISOString(),
    )}.pdf`;

    doc.save(fileName);

    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating invoice PDF:", error);
    return { success: false, error: error.message };
  }
};

// Generate a compressed invoice PDF for email attachment (no logo, minimal size)
export const generateInvoicePDFBase64 = async (
  invoice: Invoice,
): Promise<{
  success: boolean;
  base64?: string;
  fileName?: string;
  error?: string;
}> => {
  const fileName = `invoice_${invoice.invoice_number}.pdf`;

  // Builds the compact invoice at a given image resolution and returns its
  // base64 data-uri. imageDpi only affects the optional "PAID" stamp; lowering
  // it shrinks the attachment so we can keep it under the EmailJS 500 KB limit.
  const build = async (imageDpi: number): Promise<string> => {
    const doc = new jsPDF({ compress: true });

    // Header — text only, no logo to keep size small
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 105, 20, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_INFO.name, 14, 32);
    doc.text(`ABN: ${COMPANY_INFO.abn}`, 14, 37);
    doc.text(
      `Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`,
      14,
      42,
    );

    // Invoice info (right)
    doc.text(`Invoice #: ${invoice.invoice_number}`, 196, 32, {
      align: "right",
    });
    doc.text(`Date: ${getDateFormatted(invoice.invoice_date)}`, 196, 37, {
      align: "right",
    });
    if ((invoice as any).due_date) {
      doc.text(
        `Due Date: ${getDateFormatted((invoice as any).due_date)}`,
        196,
        42,
        { align: "right" },
      );
    }
    doc.text(`Status: ${invoice.status?.toUpperCase()}`, 196, 52, {
      align: "right",
    });

    // Divider
    doc.setDrawColor(156, 106, 58);
    doc.setLineWidth(0.5);
    doc.line(14, 57, 196, 57);

    // Bill To
    const customer = invoice.customer;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 65);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 70);
    const fullAddress = formatFullAddress({
      address: invoice.address,
      suburb: invoice.suburb,
      state: invoice.state,
      postCode: invoice.post_code,
    });
    const addressParts = [
      ...(fullAddress ? (doc.splitTextToSize(fullAddress, 120) as string[]) : []),
      customer?.email ? `Email: ${customer.email}` : null,
      customer?.phone ? `Phone: ${customer.phone}` : null,
    ].filter(Boolean);
    let addrY = 75;
    addressParts.forEach((line) => {
      doc.text(line as string, 14, addrY);
      addrY += 4.5;
    });

    // Items Table
    const items = [...(invoice.invoice_items || [])].sort(
    (a: any, b: any) =>
      (a.sort_order ?? a.id ?? 0) - (b.sort_order ?? b.id ?? 0),
  );
    const tableData = items.map((item: any, index: number) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const gst = (item.item_gst ?? item.items?.gst) || false;
      const name = (item.item_name ?? item.items?.name) || "N/A";
      const nameWithGst = gst ? `${name} *` : name;
      const itemCell = item.note ? `${nameWithGst}\nNote: ${item.note}` : nameWithGst;
      return [
        index + 1,
        itemCell,
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

    const discountType = (invoice as any).discount_type || "percentage";
    const discountRaw = invoice.discount || 0;
    const discountAmount =
      discountType === "fixed"
        ? Math.min(discountRaw, subtotalWithGST)
        : (subtotalWithGST * discountRaw) / 100;
    const grandTotal = subtotalWithGST - discountAmount;
    const depositPaid = Number((invoice as any).deposit) || 0;
    const totalDue = Math.max(0, grandTotal - depositPaid);

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

    // Disclaimer — only add page if this line itself won't fit
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    const gstDisclaimerLines = doc.splitTextToSize(
      "* Items marked with an asterisk (*) are GST applicable. All materials supplied are non-returnable and non-refundable. Payment is required by the due date shown on this invoice. Thank you for your business",
      180,
    );
    let finalY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 5, gstDisclaimerLines.length * 4.5);
    doc.text(gstDisclaimerLines, 14, finalY);

    // Totals — only add page if totals block won't fit
    finalY = checkAndAddPage(doc, finalY + gstDisclaimerLines.length * 4.5 + 4, discountRaw > 0 ? 36 : 26);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 140, finalY);
    doc.text(`$${totalSubtotal.toFixed(2)}`, 196, finalY, { align: "right" });
    finalY += 5;
    doc.text("GST:", 140, finalY);
    doc.text(`$${totalGST.toFixed(2)}`, 196, finalY, { align: "right" });
    if (discountRaw > 0) {
      finalY += 5;
      const discountLabel =
        discountType === "fixed"
          ? `Discount ($${formatAmount(discountRaw)}):`
          : `Discount (${formatAmount(discountRaw)}%):`;
      doc.text(discountLabel, 140, finalY);
      doc.text(`-$${discountAmount.toFixed(2)}`, 196, finalY, {
        align: "right",
      });
    }
    finalY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 140, finalY);
    doc.text(`$${totalDue.toFixed(2)}`, 196, finalY, { align: "right" });

    // Bank Details — only add page if the 5 bank lines won't fit (~30mm)
    finalY = checkAndAddPage(doc, finalY + 12, 30);
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
    finalY += 4.5;
    doc.text("Reference: " + invoice.invoice_number, 14, finalY);

    if (invoice.note) {
      const splitNotes = doc.splitTextToSize(invoice.note, 180);
      finalY = checkAndAddPage(doc, finalY + 8, splitNotes.length * 4.5 + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Notes:", 14, finalY);
      doc.setFont("helvetica", "normal");
      finalY += 4;
      doc.text(splitNotes, 14, finalY);
    }

    // Paid stamp overlay
    if (invoice.status === "paid") {
      await addPaidStampImage(doc, imageDpi);
    }

    return doc.output("datauristring");
  };

  try {
    // Compression layer: render once, and if the attachment is still over the
    // 500 KB EmailJS limit, re-render the stamp at progressively lower
    // resolution until it fits. Text-only (unpaid) invoices pass on the first
    // pass since their size doesn't depend on imageDpi.
    const dpiSteps = [150, 110, 90, 72];
    let base64 = "";
    for (const dpi of dpiSteps) {
      base64 = await build(dpi);
      if (base64ByteLength(base64) <= MAX_ATTACHMENT_BYTES) break;
    }

    return { success: true, base64, fileName };
  } catch (error: any) {
    console.error("Error generating compressed invoice PDF:", error);
    return { success: false, error: error.message };
  }
};

const buildDeliveryNoteContent = async (doc: jsPDF, invoice: Invoice) => {
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

  doc.setFont("helvetica", "normal");
  doc.text(`Delivery Note #: ${invoice.invoice_number}-DEL`, 180, 60, { align: "right" });
  doc.text(`Date: ${getDateFormatted(new Date().toISOString())}`, 180, 65, { align: "right" });
  doc.text(`Invoice #: ${invoice.invoice_number}`, 180, 70, { align: "right" });
  doc.text(`Status: ${invoice.delivery_status?.replace(/_/g, " ").toUpperCase() || ""}`, 180, 75, { align: "right" });

  const customer = invoice.customer;
  doc.setFont("helvetica", "bold");
  doc.text("DELIVER TO:", 14, 95);
  doc.setFont("helvetica", "normal");
  doc.text(customer?.name || "N/A", 14, 100);
  const delAddrLines = doc.splitTextToSize(
    formatFullAddress({
      address: invoice.address,
      suburb: invoice.suburb,
      state: invoice.state,
      postCode: invoice.post_code,
    }),
    110,
  );
  doc.text(delAddrLines, 14, 105);
  doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 105 + delAddrLines.length * 5);

  const items = [...(invoice.invoice_items || [])].sort(
    (a: any, b: any) => (a.sort_order ?? a.id ?? 0) - (b.sort_order ?? b.id ?? 0),
  );
  const tableData = items.map((item: any, index: number) => {
    const quantity = parseFloat(item.quantity) || 0;
    const gst = (item.item_gst ?? item.items?.gst) || false;
    const itemName = (item.item_name ?? item.items?.name) || "N/A";
    return [index + 1, gst ? `${itemName} *` : itemName, quantity.toFixed(2), ""];
  });

  autoTable(doc, {
    startY: 120,
    head: [["#", "Item Description", "Quantity", "Received"]],
    body: tableData,
    theme: "grid",
    showHead: "everyPage",
    margin: { top: 14, right: 14, bottom: 5, left: 14 },
    headStyles: { fillColor: BRAND_COLORS.primary as any, textColor: 255 },
    styles: { fontSize: 9, lineColor: BRAND_COLORS.tableBorder as any, textColor: BRAND_COLORS.textDark as any },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 102 }, 2: { cellWidth: 30 }, 3: { cellWidth: 40 } },
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const gstDisclaimerLines = doc.splitTextToSize(
    "* Items marked with an asterisk (*) are GST applicable. All materials supplied are non-returnable and non-refundable. Payment is required by the due date shown on this invoice. Thank you for your business",
    180,
  );
  let delivFinalY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 6, gstDisclaimerLines.length * 4.5);
  doc.text(gstDisclaimerLines, 14, delivFinalY);

  let bankY = checkAndAddPage(doc, delivFinalY + gstDisclaimerLines.length * 4.5 + 5, 35);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Bank Details:", 14, bankY);
  doc.setFont("helvetica", "normal");
  doc.text("Bank Detail: Commonwealth Bank", 14, bankY + 7);
  doc.text("Account Name: Timbermax Supply Pty Ltd", 14, bankY + 14);
  doc.text("BSB No: 065 167", 14, bankY + 21);
  doc.text("Account Number: 1056 5353", 14, bankY + 28);

  let noteY = bankY + 32;
  if (invoice.note) {
    const splitNotes = doc.splitTextToSize(invoice.note, 180);
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

export const generateDeliveryNotePDF = async (
  invoice: Invoice,
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF({ compress: true });
    await buildDeliveryNoteContent(doc, invoice);
    const fileName = `delivery_note_${invoice.invoice_number}_${getDateFormatted(new Date().toISOString())}.pdf`;
    doc.save(fileName);
    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating delivery note:", error);
    return { success: false, error: error.message };
  }
};

const openBlobAndPrint = (doc: jsPDF) => {
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

export const printInvoicePDF = async (
  invoice: Invoice,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const doc = new jsPDF({ compress: true });
    await buildInvoicePDF(doc, invoice);
    openBlobAndPrint(doc);
    return { success: true };
  } catch (error: any) {
    console.error("Error printing invoice PDF:", error);
    return { success: false, error: error.message };
  }
};

export const printDeliveryNotePDF = async (
  invoice: Invoice,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const doc = new jsPDF({ compress: true });
    await buildDeliveryNoteContent(doc, invoice);
    openBlobAndPrint(doc);
    return { success: true };
  } catch (error: any) {
    console.error("Error printing delivery note PDF:", error);
    return { success: false, error: error.message };
  }
};

// ==================== CUSTOMER INVOICE REPORT PDF ====================

export interface ReportPdfData {
  customerName: string;
  customerId: number;
  rangeLabel: string;
  summary: {
    count: number;
    grandTotal: number;
    subtotalTotal: number;
    gstTotal: number;
    paidTotal: number;
    paidCount: number;
    outstandingTotal: number;
    outstandingCount: number;
    cancelledTotal: number;
    cancelledCount: number;
    depositTotal: number;
    itemsTotal: number;
    byStatus: Record<string, { count: number; total: number }>;
  };
  rows: any[];
}

const cap = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export const generateCustomerReportPDF = async (
  report: ReportPdfData,
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF({ compress: true });
    await addCompanyLogo(doc, 14, 20);

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER INVOICE STATEMENT", 105, 45, { align: "center" });

    // Company info (left)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_INFO.name, 14, 60);
    doc.text(`ABN: ${COMPANY_INFO.abn}`, 14, 65);
    doc.text(`Phone: ${COMPANY_INFO.phone}`, 14, 70);
    doc.text(`Email: ${COMPANY_INFO.email}`, 14, 75);

    // Report meta (right)
    doc.setFont("helvetica", "bold");
    doc.text(`Customer: ${report.customerName || "N/A"}`, 196, 60, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${report.rangeLabel}`, 196, 65, { align: "right" });
    doc.text(`Generated: ${getDateFormatted(new Date())}`, 196, 70, {
      align: "right",
    });

    // Summary box
    const s = report.summary;
    doc.setDrawColor(...(BRAND_COLORS.tableBorder as [number, number, number]));
    doc.setFillColor(253, 246, 239); // #fdf6ef
    doc.roundedRect(14, 88, 182, 26, 2, 2, "FD");

    const summaryCells: [string, string][] = [
      ["Total Invoiced", `$${s.grandTotal.toFixed(2)}`],
      ["Amount Paid", `$${s.paidTotal.toFixed(2)} (${s.paidCount})`],
      ["Balance Due", `$${s.outstandingTotal.toFixed(2)} (${s.outstandingCount})`],
      ["Invoices / Items", `${s.count} (${s.itemsTotal} items)`],
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

    // Detail table
    const tableData = report.rows.map((inv: any) => [
      inv.invoice_number ?? "",
      getDateFormatted(inv.invoice_date),
      cap(inv.status ?? ""),
      cap(inv.delivery_status || "pending"),
      String(inv.invoice_items?.length || 0),
      inv.deposit ? `$${(Number(inv.deposit) || 0).toFixed(2)}` : "-",
      `$${(Number(inv.total) || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 120,
      head: [
        ["Invoice No.", "Invoice Date", "Status", "Fulfilment", "Items", "Payments / Deposit", "Invoice Total"],
      ],
      body: tableData,
      foot: [
        [
          { content: "Total", colSpan: 5, styles: { halign: "right" } } as any,
          `$${s.depositTotal.toFixed(2)}`,
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
        0: { cellWidth: 32 },
        4: { halign: "center" },
        5: { halign: "right" },
        6: { halign: "right" },
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

    // Cancelled note
    let finalY = checkAndAddPage(doc, totalsY + 8, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Cancelled invoices are excluded from this statement. Cancelled total: $${s.cancelledTotal.toFixed(
        2,
      )} across ${s.cancelledCount} invoices.`,
      14,
      finalY,
    );

    // Bank Details — same block as a normal invoice; new page if it won't fit
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

    const fileName = `report_customer_${report.customerId}_${getDateFormatted(
      new Date(),
    ).replace(/-/g, "")}.pdf`;
    doc.save(fileName);
    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating report PDF:", error);
    return { success: false, error: error.message };
  }
};
