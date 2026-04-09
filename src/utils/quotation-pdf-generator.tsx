import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quotation } from "types";
import { getDateFormatted } from "./helpers";
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

// Returns updated Y — adds a new page if the needed space won't fit
const checkAndAddPage = (doc: jsPDF, currentY: number, neededMM: number, topMargin: number = 14): number => {
  const pageHeight = doc.internal.pageSize.height;
  if (currentY + neededMM > pageHeight - 14) {
    doc.addPage();
    return topMargin;
  }
  return currentY;
};

export const generateAndDownloadQuotationPDF = async (
  quotation: Quotation
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();

    // Add company logo in top left corner
    await addCompanyLogo(doc, 14, 20);

    // Header - moved down to make room for logo
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", 105, 45, { align: "center" }); // Increased y from 20 to 45

    // Company Info - moved down
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("TIMBER MAX SUPPLY PTY LTD", 14, 60);
    doc.text("ABN: 95 689 199 773", 14, 65);
    doc.text("Phone: 08 8212 4703", 14, 70);
    doc.text("Email: info@timbermax.com.au", 14, 75);
    doc.text("Website: timbermax.com.au", 14, 80);

    // Quotation Info (right aligned) - moved down
    doc.setFont("helvetica", "normal");
    doc.text(`Quotation #: ${quotation.quotation_number}`, 180, 60, {
      align: "right",
    });
    doc.text(`Date: ${getDateFormatted(quotation.created_at)}`, 180, 65, {
      align: "right",
    });
    // doc.text(
    //   `Valid Until: ${
    //     quotation.valid_until ? getDateFormatted(quotation.valid_until) : "N/A"
    //   }`,
    //   180,
    //   70,
    //   { align: "right" }
    // );

    // Customer Info - moved down
    // Use address snapshot from quotation, not from customer table
    const customer = quotation.customers;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 95); // Increased y from 65 to 95
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 100); // Increased y
    doc.text(quotation.address || "", 14, 105); // Use quotation address snapshot
    if (quotation.suburb) {
      doc.text(
        `${quotation.suburb} ${quotation.state} ${quotation.post_code}`,
        14,
        110 // Increased y
      );
    }
    doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 115); // Increased y
    doc.text(`Email: ${customer?.email || "N/A"}`, 14, 120); // Increased y

    // Items Table - moved startY down
    const items = quotation.quotation_items || [];
    const tableData = items.map((item: any, index: number) => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unit_price);
      const subtotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      
      // Add star (*) to item name if GST applies
      const itemName = item.items?.name || "N/A";
      const itemNameWithGst = gst ? `${itemName} *` : itemName;

      return [
        index + 1,
        itemNameWithGst,
        quantity.toFixed(2),
        `$${unitPrice.toFixed(2)}`,
        `$${subtotal.toFixed(2)}`, // Now showing subtotal (without GST)
      ];
    });

    // Calculate totals
    let totalSubtotal = 0;
    let totalGST = 0;
    let subtotalWithGST = 0;

    items.forEach((item: any) => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unit_price);
      const subtotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      const gstAmount = gst ? subtotal * 0.1 : 0;

      totalSubtotal += subtotal;
      totalGST += gstAmount;
      subtotalWithGST += subtotal + gstAmount;
    });

    // Apply discount if present
    const discountRaw = quotation.discount || 0;
    const discountType = (quotation as any).discount_type || "percentage";
    const discountAmount = discountType === "fixed"
      ? Math.min(discountRaw, subtotalWithGST)
      : (subtotalWithGST * discountRaw) / 100;
    const grandTotal = subtotalWithGST - discountAmount;

    autoTable(doc, {
      startY: 130, // Increased from 100 to 130
      head: [["#", "Items", "Qty", "Unit Price", "Total"]],
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
        0: { cellWidth: 10 }, // #
        1: { cellWidth: 95 }, // Description
        2: { cellWidth: 20 }, // Qty
        3: { cellWidth: 30 }, // Unit Price
        4: { cellWidth: 30 }, // Total
      },
    });

    // Disclaimer — only add page if the disclaimer itself won't fit
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const gstDisclaimerLines = doc.splitTextToSize(
      "* Items marked with an asterisk (*) are GST applicable. All materials supplied are non-returnable and non-refundable. Payment is required by the due date shown on this invoice. Thank you for your business",
      180,
    );
    let postTableY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 10, gstDisclaimerLines.length * 4.5);
    doc.text(gstDisclaimerLines, 14, postTableY);

    // Summary Section — only add page if summary block won't fit
    const summaryNeeded = 10 + (discountRaw > 0 ? 40 : 30);
    let summaryY = checkAndAddPage(doc, postTableY + gstDisclaimerLines.length * 4.5 + 12, summaryNeeded);
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
      const discountLabel = discountType === "fixed"
        ? `Discount ($${discountRaw.toFixed(2)}):`
        : `Discount (${discountRaw}%):`;
      doc.text(discountLabel, 120, currentY);
      doc.text(`-$${discountAmount.toFixed(2)}`, 180, currentY, { align: "right" });
    }

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total:`, 120, currentY);
    doc.text(`$${grandTotal.toFixed(2)}`, 180, currentY, { align: "right" });

    // Bank Details — only add page if the 4 bank lines won't fit (~35mm)
    let bankY = checkAndAddPage(doc, currentY + 20, 35);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 14, bankY);
    doc.setFont("helvetica", "normal");
    doc.text("Bank Detail: Commonwealth Bank", 14, bankY + 7);
    doc.text("Account Name: Timbermax Supply Pty Ltd", 14, bankY + 14);
    doc.text("BSB No: 065 167", 14, bankY + 21);
    doc.text("Account Number: 1056 5353", 14, bankY + 28);

    // Notes — only add page if notes themselves won't fit
    if (quotation.note) {
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      let notesY = checkAndAddPage(doc, bankY + 40, splitNotes.length * 4.5 + 12);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, notesY);
      doc.setFont("helvetica", "normal");
      doc.text(splitNotes, 14, notesY + 6);
    }

    const fileName = `quotation_${quotation.quotation_number}_${getDateFormatted(
      new Date().toISOString()
    )}.pdf`;

    doc.save(fileName);

    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return { success: false, error: error.message };
  }
};

// Update the Delivery Document function
export const generateAndDownloadDeliveryDocument = async (
  quotation: Quotation
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();

    // Add company logo in top left corner
    await addCompanyLogo(doc, 14, 20);

    // Header - moved down
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("DELIVERY DOCUMENT", 105, 45, { align: "center" });

    // Company Info - moved down
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("TIMBER MAX SUPPLY PTY LTD", 14, 60);
    doc.text("ABN: 95 688 199 773", 14, 65);
    doc.text("Phone: 08 8212 4703", 14, 70);
    doc.text("Email: info@timbermax.com.au", 14, 75);
    doc.text("Website: timbermax.com.au", 14, 80);

    // Document Info (right aligned) - moved down
    doc.text(
      `Delivery Document #: ${quotation.quotation_number}-DEL`,
      180,
      60,
      {
        align: "right",
      }
    );
    doc.text(`Date: ${getDateFormatted(new Date().toISOString())}`, 180, 65, {
      align: "right",
    });
    doc.text(`Quotation #: ${quotation.quotation_number}`, 180, 70, {
      align: "right",
    });

    // Customer Info - moved down
    // Use address snapshot from quotation, not from customer table
    const customer = quotation.customers as any;
    doc.setFont("helvetica", "bold");
    doc.text("DELIVER TO:", 14, 100); // Increased y
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 105);
    doc.text(quotation.address || "", 14, 110); // Use quotation address snapshot
    if (quotation.suburb) {
      doc.text(
        `${quotation.suburb} ${quotation.state} ${quotation.post_code}`,
        14,
        115
      );
    }
    doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 120);

    // Items Table for Delivery
    const items = quotation.quotation_items || [];
    const tableData = items.map((item: any, index: number) => {
      const quantity = parseFloat(item.quantity);
      const gst = item.items?.gst || false;
      const itemName = item.items?.name || "N/A";
      const itemNameWithGst = gst ? `${itemName} *` : itemName;

      return [
        index + 1,
        itemNameWithGst,
        quantity.toFixed(2),
      ];
    });

    autoTable(doc, {
      startY: 135, // Increased from 100
      head: [["#", "Item Description", "Quantity"]],
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
        1: { cellWidth: 110 },
        2: { cellWidth: 30 },
      },
    });

    // Disclaimer — only add page if the disclaimer itself won't fit
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const gstDisclaimerLines = doc.splitTextToSize(
      "* Items marked with an asterisk (*) are GST applicable. All materials supplied are non-returnable and non-refundable. Payment is required by the due date shown on this invoice. Thank you for your business",
      180,
    );
    let delivFinalY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 20, gstDisclaimerLines.length * 4.5);
    doc.text(gstDisclaimerLines, 14, delivFinalY);

    // Bank Details — only add page if the 4 bank lines won't fit (~35mm)
    let bankY = checkAndAddPage(doc, delivFinalY + gstDisclaimerLines.length * 4.5 + 6, 35);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 14, bankY);
    doc.setFont("helvetica", "normal");
    doc.text("Bank Detail: Commonwealth Bank", 14, bankY + 7);
    doc.text("Account Name: Timbermax Supply Pty Ltd", 14, bankY + 14);
    doc.text("BSB No: 065 167", 14, bankY + 21);
    doc.text("Account Number: 1056 5353", 14, bankY + 28);

    // Notes Section
    let noteStartY = bankY + 38;
    if (quotation.note) {
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      noteStartY = checkAndAddPage(doc, noteStartY, splitNotes.length * 4.5 + 12);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, noteStartY);
      doc.setFont("helvetica", "normal");
      doc.text(splitNotes, 14, noteStartY + 6);
      noteStartY += splitNotes.length * 4.5 + 10;
    }

    // Delivery Instructions — only add page if instructions + signatures won't fit (~60mm)
    let instructionsY = checkAndAddPage(doc, noteStartY + 10, 60);
    doc.setFont("helvetica", "bold");
    doc.text("Delivery Instructions:", 14, instructionsY);
    doc.setFont("helvetica", "normal");
    doc.text("Please ensure all items are checked upon delivery.", 14, instructionsY + 10);

    // Signature Section
    doc.setFont("helvetica", "bold");
    doc.text("Customer Signature:", 14, instructionsY + 40);
    doc.line(14, instructionsY + 45, 100, instructionsY + 45);

    doc.text("Delivery Person:", 120, instructionsY + 40);
    doc.line(120, instructionsY + 45, 180, instructionsY + 45);

    const fileName = `delivery_${quotation.quotation_number}_${getDateFormatted(
      new Date().toISOString()
    )}.pdf`;

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
    doc.text("TO:", 14, 54);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 59);
    const addressParts = [
      quotation.address,
      [quotation.suburb, quotation.state, quotation.post_code].filter(Boolean).join(" "),
      customer?.email ? `Email: ${customer.email}` : null,
      customer?.phone ? `Phone: ${customer.phone}` : null,
    ].filter(Boolean);
    let addrY = 64;
    addressParts.forEach((line) => {
      doc.text(line as string, 14, addrY);
      addrY += 4.5;
    });

    // Items table
    const items = quotation.quotation_items || [];
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
      const gstAmt = item.items?.gst ? sub * 0.1 : 0;
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
      "* Items marked with an asterisk (*) are GST applicable. All materials supplied are non-returnable and non-refundable. Payment is required by the due date shown on this invoice. Thank you for your business",
      180,
    );
    let finalY = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 6, gstDisclaimerLines.length * 4.5);
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

// Update the openQuotationPDFInNewTab function
export const openQuotationPDFInNewTab = async (
  quotation: Quotation
): Promise<void> => {
  try {
    const doc = new jsPDF();

    // Add company logo
    await addCompanyLogo(doc, 14, 20);

    // Header - moved down
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", 105, 45, { align: "center" });

    // Company Info - moved down
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("TIMBER MAX SUPPLY PTY LTD", 14, 60);
    doc.text("ABN: 95 688 199 773", 14, 65);
    doc.text("Phone: 08 8212 4703", 14, 70);
    doc.text("Email: info@timbermax.com.au", 14, 75);
    doc.text("Website: timbermax.com.au", 14, 80);

    // Quotation Info (right aligned) - moved down
    doc.setFont("helvetica", "normal");
    doc.text(`Quotation #: ${quotation.quotation_number}`, 180, 60, {
      align: "right",
    });
    doc.text(`Date: ${getDateFormatted(quotation.created_at)}`, 180, 65, {
      align: "right",
    });
    // doc.text(
    //   `Valid Until: ${
    //     quotation.valid_until ? getDateFormatted(quotation.valid_until) : "N/A"
    //   }`,
    //   180,
    //   70,
    //   { align: "right" }
    // );

    // Customer Info - moved down
    // Use address snapshot from quotation, not from customer table
    const customer = quotation.customers;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 95);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 100);
    doc.text(quotation.address || "", 14, 105); // Use quotation address snapshot
    if (quotation.suburb) {
      doc.text(
        `${quotation.suburb} ${quotation.state} ${quotation.post_code}`,
        14,
        110
      );
    }
    doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 115);
    doc.text(`Email: ${customer?.email || "N/A"}`, 14, 120);

    // Items Table
    const items = quotation.quotation_items || [];
    const tableData = items.map((item: any, index: number) => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unit_price);
      const subtotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      
      // Add star (*) to item name if GST applies
      const itemName = item.items?.name || "N/A";
      const itemNameWithGst = gst ? `${itemName} *` : itemName;

      return [
        index + 1,
        itemNameWithGst,
        quantity.toFixed(2),
        `$${unitPrice.toFixed(2)}`,
        `$${subtotal.toFixed(2)}`, // Now showing subtotal (without GST)
      ];
    });

    // Calculate totals
    let totalSubtotal = 0;
    let totalGST = 0;
    let subtotalWithGST = 0;

    items.forEach((item: any) => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unit_price);
      const subtotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      const gstAmount = gst ? subtotal * 0.1 : 0;

      totalSubtotal += subtotal;
      totalGST += gstAmount;
      subtotalWithGST += subtotal + gstAmount;
    });

    // Apply discount if present
    const discountRaw3 = quotation.discount || 0;
    const discountType3 = (quotation as any).discount_type || "percentage";
    const discountAmount = discountType3 === "fixed"
      ? Math.min(discountRaw3, subtotalWithGST)
      : (subtotalWithGST * discountRaw3) / 100;
    const grandTotal = subtotalWithGST - discountAmount;

    autoTable(doc, {
      startY: 130,
      head: [["#", "Items", "Qty", "Unit Price", "Total"]],
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
        0: { cellWidth: 10 }, // #
        1: { cellWidth: 95 }, // Description
        2: { cellWidth: 20 }, // Qty
        3: { cellWidth: 30 }, // Unit Price
        4: { cellWidth: 30 }, // Total
      },
    });

    // Disclaimer — only add page if the disclaimer itself won't fit
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const gstDisclaimerLines = doc.splitTextToSize(
      "* Items marked with an asterisk (*) are GST applicable. All materials supplied are non-returnable and non-refundable. Payment is required by the due date shown on this invoice. Thank you for your business",
      180,
    );
    let postTableY3 = checkAndAddPage(doc, (doc as any).lastAutoTable.finalY + 10, gstDisclaimerLines.length * 4.5);
    doc.text(gstDisclaimerLines, 14, postTableY3);

    // Summary Section — only add page if summary block won't fit
    const summaryNeeded3 = 10 + (discountRaw3 > 0 ? 40 : 30);
    let summaryY = checkAndAddPage(doc, postTableY3 + gstDisclaimerLines.length * 4.5 + 12, summaryNeeded3);
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

    if (discountRaw3 > 0) {
      currentY += 10;
      const discountLabel3 = discountType3 === "fixed"
        ? `Discount ($${discountRaw3.toFixed(2)}):`
        : `Discount (${discountRaw3}%):`;
      doc.text(discountLabel3, 120, currentY);
      doc.text(`-$${discountAmount.toFixed(2)}`, 180, currentY, { align: "right" });
    }

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total:`, 120, currentY);
    doc.text(`$${grandTotal.toFixed(2)}`, 180, currentY, { align: "right" });

    // Bank Details — only add page if the 4 bank lines won't fit (~35mm)
    let bankY = checkAndAddPage(doc, currentY + 20, 35);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 14, bankY);
    doc.setFont("helvetica", "normal");
    doc.text("Bank Detail: Commonwealth Bank", 14, bankY + 7);
    doc.text("Account Name: Timbermax Supply Pty Ltd", 14, bankY + 14);
    doc.text("BSB No: 065 167", 14, bankY + 21);
    doc.text("Account Number: 1056 5353", 14, bankY + 28);

    // Notes — only add page if notes themselves won't fit
    if (quotation.note) {
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      let notesY = checkAndAddPage(doc, bankY + 40, splitNotes.length * 4.5 + 12);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, notesY);
      doc.setFont("helvetica", "normal");
      doc.text(splitNotes, 14, notesY + 6);
    }

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Open in new tab
    window.open(pdfUrl, "_blank");

    // Clean up the URL after some time
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
  } catch (error) {
    console.error("Error opening PDF in new tab:", error);
    throw error;
  }
};