import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BRAND_COLORS } from "themes/theme/default";
import { getDateFormatted } from "utils/helpers";
import { Invoice } from "types";

// Helper function to load and add logo (same as quotation example)
const addCompanyLogo = async (
  doc: jsPDF,
  xPosition: number = 14,
  yPosition: number = 20,
) => {
  try {
    // Path to the logo - same as quotation example
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
          doc.addImage(base64, "JPEG", xPosition, yPosition, 30, 15); // Adjust size as needed
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

// Constants for consistent company branding
const COMPANY_INFO = {
  name: "TIMBER MAX SUPPLY PTY LTD",
  abn: "95 689 199 773",
  phone: "(123) 456-7890",
  email: "info@timbermax.com.au",
  website: "timbermax.com.au",
};

// Adds a "PAID" stamp image to the bottom-right of the page
const addPaidStampImage = async (doc: jsPDF) => {
  try {
    const stampUrl = "/paid.png";
    if (typeof window !== "undefined") {
      const response = await fetch(stampUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise<void>((resolve, reject) => {
        reader.onload = function () {
          const base64 = reader.result as string;
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          const stampWidth = 60;
          const stampHeight = 60;
          const x = pageWidth - stampWidth - 10;
          const y = pageHeight - stampHeight - 10;
          doc.addImage(base64, "PNG", x, y, stampWidth, stampHeight);
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error("Error loading paid stamp:", error);
  }
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
  doc.text(`Status: ${invoice.status?.toUpperCase()}`, 180, 70, {
    align: "right",
  });
  if (invoice.delivery_status) {
    doc.text(`Delivery: ${invoice.delivery_status?.toUpperCase()}`, 180, 75, {
      align: "right",
    });
  }
  if (invoice.quotation_id) {
    doc.text(`Ref Quote: ${invoice.quotation_id}`, 180, 80, {
      align: "right",
    });
  }

  // Customer Info
  const customer = invoice.customer;
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 14, 95);
  doc.setFont("helvetica", "normal");
  doc.text(customer?.name || "N/A", 14, 100);
  doc.text(invoice.address || "", 14, 105);
  if (invoice.suburb) {
    doc.text(
      `${invoice.suburb} ${invoice.state} ${invoice.post_code}`,
      14,
      110,
    );
  }
  doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 115);
  doc.text(`Email: ${customer?.email || "N/A"}`, 14, 125);

  // Items Table
  const items = invoice.invoice_items || [];
  const tableData = items.map((item: any, index: number) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const subtotal = quantity * unitPrice;
    const gst = item.items?.gst || false;

    const itemName = item.items?.name || "N/A";
    const itemNameWithGst = gst ? `${itemName} *` : itemName;

    return [
      index + 1,
      itemNameWithGst,
      item.items?.itemCode || "N/A",
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
    const gst = item.items?.gst || false;
    const gstAmount = gst ? subtotal * 0.1 : 0;

    totalSubtotal += subtotal;
    totalGST += gstAmount;
    subtotalWithGST += subtotal + gstAmount;
  });

  const discountType = (invoice as any).discount_type || "percentage";
  const discountRaw = invoice.discount || 0;
  const discountAmount = discountType === "fixed"
    ? Math.min(discountRaw, subtotalWithGST)
    : (subtotalWithGST * discountRaw) / 100;
  const grandTotal = subtotalWithGST - discountAmount;

  autoTable(doc, {
    startY: 135,
    head: [["#", "Items", "Code", "Qty", "Unit Price", "Total"]],
    body: tableData,
    theme: "grid",
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
      1: { cellWidth: 70 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "* Items marked with an asterisk (*) are GST applicable",
    14,
    finalY,
  );

  // Summary Section
  const summaryY = finalY + 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Summary:", 120, summaryY);

  doc.setFont("helvetica", "normal");
  let currentY = summaryY + 10;

  doc.text(`Subtotal:`, 120, currentY);
  doc.text(`$${totalSubtotal.toFixed(2)}`, 180, currentY, {
    align: "right",
  });

  currentY += 10;
  doc.text(`GST:`, 120, currentY);
  doc.text(`$${totalGST.toFixed(2)}`, 180, currentY, {
    align: "right",
  });

  if (discountRaw > 0) {
    currentY += 10;
    const discountLabel = discountType === "fixed"
      ? `Discount ($${discountRaw.toFixed(2)}):`
      : `Discount (${discountRaw}%):`;
    doc.text(discountLabel, 120, currentY);
    doc.text(`-$${discountAmount.toFixed(2)}`, 180, currentY, {
      align: "right",
    });
  }

  currentY += 10;
  doc.setFont("helvetica", "bold");
  doc.text(`Total Due:`, 120, currentY);
  doc.text(`$${grandTotal.toFixed(2)}`, 180, currentY, {
    align: "right",
  });

  // Payment Terms
  const paymentTermsY = currentY + 20;
  doc.setFont("helvetica", "bold");
  doc.text("Payment Terms:", 14, paymentTermsY);
  doc.setFont("helvetica", "normal");
  doc.text("Please pay within 30 days of invoice date.", 14, paymentTermsY + 5);
  doc.text("Bank Details:", 14, paymentTermsY + 10);
  doc.text("Bank: Commonwealth Bank", 14, paymentTermsY + 15);
  doc.text("BSB: 123-456", 14, paymentTermsY + 20);
  doc.text("Account: 12345678", 14, paymentTermsY + 25);
  doc.text("Reference: " + invoice.invoice_number, 14, paymentTermsY + 30);

  // Notes Section
  if (invoice.note) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 14, paymentTermsY + 45);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(invoice.note, 180);
    doc.text(splitNotes, 14, paymentTermsY + 50);
  }

  // Paid stamp overlay
  if (invoice.status === "paid") {
    await addPaidStampImage(doc);
  }

  // Footer
  doc.setFontSize(8);
  doc.text(
    "Thank you for your business!",
    105,
    doc.internal.pageSize.height - 20,
    { align: "center" },
  );
  doc.text(
    "This is a computer-generated invoice. No signature required.",
    105,
    doc.internal.pageSize.height - 15,
    { align: "center" },
  );
};

export const generateAndDownloadInvoicePDF = async (
  invoice: Invoice,
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();
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
): Promise<{ success: boolean; base64?: string; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();

    // Header — text only, no logo to keep size small
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 105, 20, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_INFO.name, 14, 32);
    doc.text(`ABN: ${COMPANY_INFO.abn}`, 14, 37);
    doc.text(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, 14, 42);

    // Invoice info (right)
    doc.text(`Invoice #: ${invoice.invoice_number}`, 196, 32, { align: "right" });
    doc.text(`Date: ${getDateFormatted(invoice.invoice_date)}`, 196, 37, { align: "right" });
    doc.text(`Status: ${invoice.status?.toUpperCase()}`, 196, 42, { align: "right" });

    // Divider
    doc.setDrawColor(156, 106, 58);
    doc.setLineWidth(0.5);
    doc.line(14, 46, 196, 46);

    // Bill To
    const customer = invoice.customer;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 54);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 59);
    const addressParts = [
      invoice.address,
      [invoice.suburb, invoice.state, invoice.post_code].filter(Boolean).join(" "),
      customer?.email ? `Email: ${customer.email}` : null,
      customer?.phone ? `Phone: ${customer.phone}` : null,
    ].filter(Boolean);
    let addrY = 64;
    addressParts.forEach((line) => {
      doc.text(line as string, 14, addrY);
      addrY += 4.5;
    });

    // Items Table
    const items = invoice.invoice_items || [];
    const tableData = items.map((item: any, index: number) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const gst = item.items?.gst || false;
      const name = item.items?.name || "N/A";
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
      const gstAmt = (item.items?.gst) ? sub * 0.1 : 0;
      totalSubtotal += sub;
      totalGST += gstAmt;
      subtotalWithGST += sub + gstAmt;
    });

    const discountType = (invoice as any).discount_type || "percentage";
    const discountRaw = invoice.discount || 0;
    const discountAmount = discountType === "fixed"
      ? Math.min(discountRaw, subtotalWithGST)
      : (subtotalWithGST * discountRaw) / 100;
    const grandTotal = subtotalWithGST - discountAmount;

    autoTable(doc, {
      startY: addrY + 4,
      head: [["#", "Items", "Qty", "Unit Price", "Total"]],
      body: tableData,
      theme: "grid",
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

    let finalY = (doc as any).lastAutoTable.finalY + 6;

    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("* GST applicable items", 14, finalY);

    // Totals
    finalY += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 140, finalY);
    doc.text(`$${totalSubtotal.toFixed(2)}`, 196, finalY, { align: "right" });
    finalY += 5;
    doc.text("GST:", 140, finalY);
    doc.text(`$${totalGST.toFixed(2)}`, 196, finalY, { align: "right" });
    if (discountRaw > 0) {
      finalY += 5;
      const discountLabel = discountType === "fixed"
        ? `Discount ($${discountRaw.toFixed(2)}):`
        : `Discount (${discountRaw}%):`;
      doc.text(discountLabel, 140, finalY);
      doc.text(`-$${discountAmount.toFixed(2)}`, 196, finalY, { align: "right" });
    }
    finalY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Total Due:", 140, finalY);
    doc.text(`$${grandTotal.toFixed(2)}`, 196, finalY, { align: "right" });

    if (invoice.note) {
      finalY += 8;
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, finalY);
      doc.setFont("helvetica", "normal");
      finalY += 4;
      const splitNotes = doc.splitTextToSize(invoice.note, 180);
      doc.text(splitNotes, 14, finalY);
    }

    // Paid stamp overlay
    if (invoice.status === "paid") {
      await addPaidStampImage(doc);
    }

    // Footer
    doc.setFontSize(7);
    doc.text("Thank you for your business! | This is a computer-generated invoice.", 105, doc.internal.pageSize.height - 10, { align: "center" });

    const fileName = `invoice_${invoice.invoice_number}.pdf`;
    const base64 = doc.output("datauristring");

    return { success: true, base64, fileName };
  } catch (error: any) {
    console.error("Error generating compressed invoice PDF:", error);
    return { success: false, error: error.message };
  }
};

export const generateDeliveryNotePDF = async (
  invoice: Invoice,
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();

    // Add company logo
    await addCompanyLogo(doc, 14, 20);

    // Header - moved down
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("DELIVERY NOTE", 105, 45, { align: "center" });

    // Company Info - moved down (same branding)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_INFO.name, 14, 60);
    doc.text(`ABN: ${COMPANY_INFO.abn}`, 14, 65);
    doc.text(`Phone: ${COMPANY_INFO.phone}`, 14, 70);
    doc.text(`Email: ${COMPANY_INFO.email}`, 14, 75);
    doc.text(`Website: ${COMPANY_INFO.website}`, 14, 80);

    // Delivery Info (right aligned) - moved down
    doc.setFont("helvetica", "normal");
    doc.text(`Delivery Note #: ${invoice.invoice_number}-DEL`, 180, 60, {
      align: "right",
    });
    doc.text(`Date: ${getDateFormatted(new Date().toISOString())}`, 180, 65, {
      align: "right",
    });
    doc.text(`Invoice #: ${invoice.invoice_number}`, 180, 70, {
      align: "right",
    });
    doc.text(
      `Status: ${invoice.delivery_status?.toUpperCase() || ""}`,
      180,
      75,
      {
        align: "right",
      },
    );

    // Customer Info - moved down
    // Use address snapshot from invoice, not from customer table
    const customer = invoice.customer;
    doc.setFont("helvetica", "bold");
    doc.text("DELIVER TO:", 14, 95); // Increased y
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 100);
    doc.text(invoice.address || "", 14, 105); // Use invoice address snapshot
    if (invoice.suburb) {
      doc.text(
        `${invoice.suburb} ${invoice.state} ${invoice.post_code}`,
        14,
        110,
      );
    }
    doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 115);
    // doc.text(`Mobile: ${customer?.mobile || "N/A"}`, 14, 120);

    // Items Table (simplified for delivery)
    const items = invoice.invoice_items || [];
    const tableData = items.map((item: any, index: number) => {
      const quantity = parseFloat(item.quantity) || 0;
      const gst = item.items?.gst || false;
      const itemName = item.items?.name || "N/A";
      const itemNameWithGst = gst ? `${itemName} *` : itemName;

      return [
        index + 1,
        itemNameWithGst,
        item.items?.itemCode || "N/A",
        quantity.toFixed(2),
        "",
      ];
    });

    autoTable(doc, {
      startY: 130, // Increased from 100
      head: [["#", "Item Description", "Code", "Quantity", "Received"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: BRAND_COLORS.primary as any,
        textColor: 255,
      }, // Same green as quotation delivery
      styles: {
        fontSize: 9,
        lineColor: BRAND_COLORS.tableBorder as any,
        textColor: BRAND_COLORS.textDark as any,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 40 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;

    // Add GST note for delivery note too
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "* Items marked with an asterisk (*) are GST applicable",
      14,
      finalY,
    );

    // Notes Section
    const noteY = finalY + 10;
    if (invoice.note) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, noteY);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(invoice.note, 180);
      doc.text(splitNotes, 14, noteY + 10);
    }

    // Delivery Instructions
    doc.setFont("helvetica", "bold");
    const instructionsY = noteY + (invoice.note ? 30 : 10);
    doc.text("Delivery Instructions:", 14, instructionsY);
    doc.setFont("helvetica", "normal");
    doc.text(
      "1. Check all items against this delivery note.",
      14,
      instructionsY + 10,
    );
    doc.text(
      "2. Report any discrepancies immediately.",
      14,
      instructionsY + 15,
    );
    doc.text("3. Ensure packaging is intact.", 14, instructionsY + 20);

    // Signature Section
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER SIGNATURE:", 14, instructionsY + 40);
    doc.line(14, instructionsY + 45, 100, instructionsY + 45);
    doc.text("Name: ____________________", 14, instructionsY + 50);
    doc.text("Date: ____________________", 14, instructionsY + 55);

    doc.text("DELIVERY PERSON:", 120, instructionsY + 40);
    doc.line(120, instructionsY + 45, 180, instructionsY + 45);
    doc.text("Name: ____________________", 120, instructionsY + 50);
    doc.text("Date: ____________________", 120, instructionsY + 55);

    // Footer (similar to quotation delivery)
    doc.setFontSize(8);
    doc.text(
      "This document serves as proof of delivery.",
      105,
      doc.internal.pageSize.height - 20,
      { align: "center" },
    );

    const fileName = `delivery_note_${invoice.invoice_number}_${getDateFormatted(
      new Date().toISOString(),
    )}.pdf`;

    doc.save(fileName);

    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating delivery note:", error);
    return { success: false, error: error.message };
  }
};
