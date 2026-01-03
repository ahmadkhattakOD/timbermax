import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quotation } from "types";
import { getDateFormatted } from "./helpers";

// Helper function to load and add logo
const addCompanyLogo = async (doc: jsPDF, xPosition: number = 14, yPosition: number = 20) => {
  try {
    // Path to the logo - adjust based on your project structure
    // If using Next.js, you might need a different approach
    const logoUrl = '/timber.jpg';
    
    // If you're running in a browser environment
    if (typeof window !== 'undefined') {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise<void>((resolve, reject) => {
        reader.onload = function() {
          const base64 = reader.result as string;
          // Add image to PDF
          doc.addImage(base64, 'JPEG', xPosition, yPosition, 30, 15); // Adjust size as needed
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
    const customer = quotation.customers;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 95); // Increased y from 65 to 95
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 100); // Increased y
    doc.text(customer?.address || "", 14, 105); // Increased y
    if (customer?.suburb) {
      doc.text(
        `${customer.suburb} ${customer.state} ${customer.post_code}`,
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
      const baseTotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      const gstAmount = gst ? baseTotal * 0.1 : 0;
      const totalWithGST = baseTotal + gstAmount;

      return [
        index + 1,
        item.items?.name || "N/A",
        item.items?.itemCode || "N/A",
        quantity.toFixed(2),
        `$${unitPrice.toFixed(2)}`,
        gst ? "Yes" : "No",
        `$${totalWithGST.toFixed(2)}`, // Removed GST Amount column, now showing Total only
      ];
    });

    // Add GST summary
    let totalBaseAmount = 0;
    let totalGSTAmount = 0;
    let grandTotal = 0;

    items.forEach((item: any) => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unit_price);
      const baseTotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      const gstAmount = gst ? baseTotal * 0.1 : 0;

      totalBaseAmount += baseTotal;
      totalGSTAmount += gstAmount;
      grandTotal += baseTotal + gstAmount;
    });

    autoTable(doc, {
      startY: 130, // Increased from 100 to 130
      head: [
        [
          "#",
          "Description",
          "Code",
          "Qty",
          "Unit Price",
          "GST",
          "Total",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 }, // #
        1: { cellWidth: 60 }, // Description
        2: { cellWidth: 25 }, // Code
        3: { cellWidth: 20 }, // Qty
        4: { cellWidth: 30 }, // Unit Price
        5: { cellWidth: 20 }, // GST
        6: { cellWidth: 30 }, // Total
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Summary Section
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 120, finalY);

    doc.setFont("helvetica", "normal");
    doc.text(`Subtotal:`, 120, finalY + 10);
    doc.text(`GST:`, 120, finalY + 20);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total:`, 120, finalY + 30);

    doc.text(`$${totalBaseAmount.toFixed(2)}`, 180, finalY + 10, {
      align: "right",
    });
    doc.text(`$${totalGSTAmount.toFixed(2)}`, 180, finalY + 20, {
      align: "right",
    });
    doc.text(`$${grandTotal.toFixed(2)}`, 180, finalY + 30, {
      align: "right",
    });

    // Notes Section
    if (quotation.note) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, finalY + 50);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      doc.text(splitNotes, 14, finalY + 60);
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
    const customer = quotation.customers as any;
    doc.setFont("helvetica", "bold");
    doc.text("DELIVER TO:", 14, 100); // Increased y
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 105);
    doc.text(customer?.address || "", 14, 110);
    if (customer?.suburb) {
      doc.text(
        `${customer.suburb} ${customer.state} ${customer.post_code}`,
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

      return [
        index + 1,
        item.items?.name || "N/A",
        item.items?.itemCode || "N/A",
        quantity.toFixed(2),
      ];
    });

    autoTable(doc, {
      startY: 135, // Increased from 100
      head: [["#", "Item Description", "Code", "Quantity"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [34, 139, 34], textColor: 255 }, // Green header
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;

    // Delivery Instructions
    doc.setFont("helvetica", "bold");
    doc.text("Delivery Instructions:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Please ensure all items are checked upon delivery.",
      14,
      finalY + 10
    );

    // Signature Section
    doc.setFont("helvetica", "bold");
    doc.text("Customer Signature:", 14, finalY + 40);
    doc.line(14, finalY + 45, 100, finalY + 45);

    doc.text("Delivery Person:", 120, finalY + 40);
    doc.line(120, finalY + 45, 180, finalY + 45);

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
    const customer = quotation.customers;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 95);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 100);
    doc.text(customer?.address || "", 14, 105);
    if (customer?.suburb) {
      doc.text(
        `${customer.suburb} ${customer.state} ${customer.post_code}`,
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
      const baseTotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      const gstAmount = gst ? baseTotal * 0.1 : 0;
      const totalWithGST = baseTotal + gstAmount;

      return [
        index + 1,
        item.items?.name || "N/A",
        item.items?.itemCode || "N/A",
        quantity.toFixed(2),
        `$${unitPrice.toFixed(2)}`,
        gst ? "Yes" : "No",
        `$${totalWithGST.toFixed(2)}`, // Removed GST Amount column, now showing Total only
      ];
    });

    // Add GST summary
    let totalBaseAmount = 0;
    let totalGSTAmount = 0;
    let grandTotal = 0;

    items.forEach((item: any) => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unit_price);
      const baseTotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      const gstAmount = gst ? baseTotal * 0.1 : 0;

      totalBaseAmount += baseTotal;
      totalGSTAmount += gstAmount;
      grandTotal += baseTotal + gstAmount;
    });

    autoTable(doc, {
      startY: 130,
      head: [
        [
          "#",
          "Description",
          "Code",
          "Qty",
          "Unit Price",
          "GST",
          "Total",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 }, // #
        1: { cellWidth: 60 }, // Description
        2: { cellWidth: 25 }, // Code
        3: { cellWidth: 20 }, // Qty
        4: { cellWidth: 30 }, // Unit Price
        5: { cellWidth: 20 }, // GST
        6: { cellWidth: 30 }, // Total
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Summary Section
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 120, finalY);

    doc.setFont("helvetica", "normal");
    doc.text(`Subtotal:`, 120, finalY + 10);
    doc.text(`GST:`, 120, finalY + 20);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total:`, 120, finalY + 30);

    doc.text(`$${totalBaseAmount.toFixed(2)}`, 180, finalY + 10, {
      align: "right",
    });
    doc.text(`$${totalGSTAmount.toFixed(2)}`, 180, finalY + 20, {
      align: "right",
    });
    doc.text(`$${grandTotal.toFixed(2)}`, 180, finalY + 30, {
      align: "right",
    });

    // Notes Section
    if (quotation.note) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, finalY + 50);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(quotation.note, 180);
      doc.text(splitNotes, 14, finalY + 60);
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