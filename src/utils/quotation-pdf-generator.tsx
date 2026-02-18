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
    doc.text("TIMBER MAX SUPPLY PTY LTD", 14, 60); // Changed company name
    doc.text("ABN: 95 689 199 773", 14, 65); // Added ABN
    doc.text("Phone: (123) 456-7890", 14, 70);
    doc.text("Email: info@timbermax.com.au", 14, 75); // Updated email
    doc.text("Website: timbermax.com.au", 14, 80); // Added website

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
        item.items?.itemCode || "N/A",
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
    const discountPercent = quotation.discount || 0;
    const discountAmount = (subtotalWithGST * discountPercent) / 100;
    const grandTotal = subtotalWithGST - discountAmount;

    autoTable(doc, {
      startY: 130, // Increased from 100 to 130
      head: [["#", "Description", "Code", "Qty", "Unit Price", "Total"]], // Removed GST column
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
        1: { cellWidth: 70 }, // Description (increased width for star symbol)
        2: { cellWidth: 25 }, // Code
        3: { cellWidth: 20 }, // Qty
        4: { cellWidth: 30 }, // Unit Price
        5: { cellWidth: 30 }, // Total (now shows subtotal)
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Add GST note below the table
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("* Items marked with an asterisk (*) are GST applicable", 14, finalY);

    // Summary Section
    const summaryY = finalY + 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 120, summaryY);

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

    // Show discount if present
    if (discountPercent > 0) {
      currentY += 10;
      doc.text(`Discount (${discountPercent}%):`, 120, currentY);
      doc.text(`-$${discountAmount.toFixed(2)}`, 180, currentY, {
        align: "right",
      });
    }

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total:`, 120, currentY);
    doc.text(`$${grandTotal.toFixed(2)}`, 180, currentY, {
      align: "right",
    });

    // Notes Section (adjust position based on discount presence)
    const notesY = currentY + 20;
    if (quotation.note) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, notesY);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      doc.text(splitNotes, 14, notesY + 10);
    }

    // Footer
    doc.setFontSize(8);
    doc.text(
      "Thank you for your business!",
      105,
      doc.internal.pageSize.height - 20,
      { align: "center" }
    );

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
    doc.text("ABN: 95 689 199 773", 14, 65);
    doc.text("Phone: (123) 456-7890", 14, 70);
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
    doc.text(`Mobile: ${customer?.mobile || "N/A"}`, 14, 125);

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
        item.items?.itemCode || "N/A",
        quantity.toFixed(2),
      ];
    });

    autoTable(doc, {
      startY: 135, // Increased from 100
      head: [["#", "Item Description", "Code", "Quantity"]],
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
        1: { cellWidth: 80 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;

    // Add GST note for delivery document too
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("* Items marked with an asterisk (*) are GST applicable", 14, finalY);

    // Notes Section
    if (quotation.note) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, finalY + 10);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      doc.text(splitNotes, 14, finalY + 20);
    }

    // Delivery Instructions
    doc.setFont("helvetica", "bold");
    const instructionsY = finalY + (quotation.note ? 40 : 20);
    doc.text("Delivery Instructions:", 14, instructionsY);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Please ensure all items are checked upon delivery.",
      14,
      instructionsY + 10
    );

    // Signature Section
    doc.setFont("helvetica", "bold");
    doc.text("Customer Signature:", 14, instructionsY + 40);
    doc.line(14, instructionsY + 45, 100, instructionsY + 45);

    doc.text("Delivery Person:", 120, instructionsY + 40);
    doc.line(120, instructionsY + 45, 180, instructionsY + 45);

    // Footer
    doc.setFontSize(8);
    doc.text(
      "This document serves as proof of delivery.",
      105,
      doc.internal.pageSize.height - 20,
      {
        align: "center",
      }
    );

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
    doc.text("ABN: 95 689 199 773", 14, 37);
    doc.text("Phone: (123) 456-7890 | Email: info@timbermax.com.au", 14, 42);

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

    const discountPercent = (quotation as any).discount || 0;
    const discountAmount = (subtotalWithGST * discountPercent) / 100;
    const grandTotal = subtotalWithGST - discountAmount;

    autoTable(doc, {
      startY: addrY + 4,
      head: [["#", "Description", "Qty", "Unit Price", "Total"]],
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
    if (discountPercent > 0) {
      finalY += 5;
      doc.text(`Discount (${discountPercent}%):`, 140, finalY);
      doc.text(`-$${discountAmount.toFixed(2)}`, 196, finalY, { align: "right" });
    }
    finalY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 140, finalY);
    doc.text(`$${grandTotal.toFixed(2)}`, 196, finalY, { align: "right" });

    if (quotation.note) {
      finalY += 10;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, finalY);
      doc.setFont("helvetica", "normal");
      finalY += 4;
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      doc.text(splitNotes, 14, finalY);
    }

    doc.setFontSize(7);
    doc.text("Thank you for your business! | This is a computer-generated quotation.", 105, doc.internal.pageSize.height - 10, { align: "center" });

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
    doc.text("ABN: 95 689 199 773", 14, 65);
    doc.text("Phone: (123) 456-7890", 14, 70);
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
        item.items?.itemCode || "N/A",
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
    const discountPercent = quotation.discount || 0;
    const discountAmount = (subtotalWithGST * discountPercent) / 100;
    const grandTotal = subtotalWithGST - discountAmount;

    autoTable(doc, {
      startY: 130,
      head: [["#", "Description", "Code", "Qty", "Unit Price", "Total"]], // Removed GST column
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
        1: { cellWidth: 70 }, // Description (increased width for star symbol)
        2: { cellWidth: 25 }, // Code
        3: { cellWidth: 20 }, // Qty
        4: { cellWidth: 30 }, // Unit Price
        5: { cellWidth: 30 }, // Total (now shows subtotal)
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Add GST note below the table
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("* Items marked with an asterisk (*) are GST applicable", 14, finalY);

    // Summary Section
    const summaryY = finalY + 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 120, summaryY);

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

    // Show discount if present
    if (discountPercent > 0) {
      currentY += 10;
      doc.text(`Discount (${discountPercent}%):`, 120, currentY);
      doc.text(`-$${discountAmount.toFixed(2)}`, 180, currentY, {
        align: "right",
      });
    }

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total:`, 120, currentY);
    doc.text(`$${grandTotal.toFixed(2)}`, 180, currentY, {
      align: "right",
    });

    // Notes Section (adjust position based on discount presence)
    const notesY = currentY + 20;
    if (quotation.note) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, notesY);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      doc.text(splitNotes, 14, notesY + 10);
    }

    // Footer
    doc.setFontSize(8);
    doc.text(
      "Thank you for your business!",
      105,
      doc.internal.pageSize.height - 20,
      { align: "center" }
    );

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