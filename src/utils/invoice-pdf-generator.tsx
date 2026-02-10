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

export const generateAndDownloadInvoicePDF = async (
  invoice: Invoice,
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();

    // Add company logo in top left corner
    await addCompanyLogo(doc, 14, 20);

    // Header - moved down to make room for logo
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 105, 45, { align: "center" }); // Increased y from 20 to 45

    // Company Info - moved down (same as quotation)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_INFO.name, 14, 60); // Use company constant
    doc.text(`ABN: ${COMPANY_INFO.abn}`, 14, 65); // Added ABN
    doc.text(`Phone: ${COMPANY_INFO.phone}`, 14, 70);
    doc.text(`Email: ${COMPANY_INFO.email}`, 14, 75);
    doc.text(`Website: ${COMPANY_INFO.website}`, 14, 80);

    // Invoice Info (right aligned) - moved down
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

    // Customer Info - moved down
    // Use address snapshot from invoice, not from customer table
    const customer = invoice.customer;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 95); // Increased y from 65 to 95
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 100); // Increased y
    doc.text(invoice.address || "", 14, 105); // Use invoice address snapshot
    if (invoice.suburb) {
      doc.text(
        `${invoice.suburb} ${invoice.state} ${invoice.post_code}`,
        14,
        110, // Increased y
      );
    }
    doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 115); // Increased y
    // doc.text(`Mobile: ${customer?.mobile || "N/A"}`, 14, 120); // Increased y
    doc.text(`Email: ${customer?.email || "N/A"}`, 14, 125); // Increased y

    // Items Table - moved startY down
    const items = invoice.invoice_items || [];
    const tableData = items.map((item: any, index: number) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
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
    let grandTotal = 0;

    items.forEach((item: any) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const subtotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      const gstAmount = gst ? subtotal * 0.1 : 0;

      totalSubtotal += subtotal;
      totalGST += gstAmount;
      grandTotal += subtotal + gstAmount;
    });

    autoTable(doc, {
      startY: 135, // Increased from 120
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
    doc.text(`Subtotal:`, 120, summaryY + 10);
    doc.text(`GST:`, 120, summaryY + 20);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Due:`, 120, summaryY + 30);

    doc.text(`$${totalSubtotal.toFixed(2)}`, 180, summaryY + 10, {
      align: "right",
    });
    doc.text(`$${totalGST.toFixed(2)}`, 180, summaryY + 20, {
      align: "right",
    });
    doc.text(`$${grandTotal.toFixed(2)}`, 180, summaryY + 30, {
      align: "right",
    });

    // Payment Terms
    doc.setFont("helvetica", "bold");
    doc.text("Payment Terms:", 14, summaryY + 50);
    doc.setFont("helvetica", "normal");
    doc.text("Please pay within 30 days of invoice date.", 14, summaryY + 55);
    doc.text("Bank Details:", 14, summaryY + 60);
    doc.text("Bank: Commonwealth Bank", 14, summaryY + 65);
    doc.text("BSB: 123-456", 14, summaryY + 70);
    doc.text("Account: 12345678", 14, summaryY + 75);
    doc.text("Reference: " + invoice.invoice_number, 14, summaryY + 80);

    // Notes Section
    if (invoice.note) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, summaryY + 95);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(invoice.note, 180);
      doc.text(splitNotes, 14, summaryY + 100);
    }

    // Footer (same as quotation)
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
