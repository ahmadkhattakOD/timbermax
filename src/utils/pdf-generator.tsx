import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quotation } from "types";
import { getDateFormatted } from "./helpers";

export const generateAndDownloadQuotationPDF = async (
  quotation: Quotation
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", 105, 20, { align: "center" });

    // Company Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Your Company Name", 14, 35);
    doc.text("Company Address Line 1", 14, 40);
    doc.text("Company Address Line 2", 14, 45);
    doc.text("Phone: (123) 456-7890 | Email: info@company.com", 14, 50);

    // Quotation Info (right aligned)
    doc.setFont("helvetica", "normal");
    doc.text(`Quotation #: ${quotation.quotation_number}`, 180, 35, {
      align: "right",
    });
    doc.text(`Date: ${getDateFormatted(quotation.created_at)}`, 180, 40, {
      align: "right",
    });
    doc.text(
      `Valid Until: ${
        quotation.valid_until ? getDateFormatted(quotation.valid_until) : "N/A"
      }`,
      180,
      45,
      { align: "right" }
    );

    // Customer Info
    const customer = quotation.customers;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 65);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 70);
    doc.text(customer?.address || "", 14, 75);
    if (customer?.suburb) {
      doc.text(
        `${customer.suburb} ${customer.state} ${customer.post_code}`,
        14,
        80
      );
    }
    doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 85);
    doc.text(`Email: ${customer?.email || "N/A"}`, 14, 90);

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
        `$${gstAmount.toFixed(2)}`,
        `$${totalWithGST.toFixed(2)}`,
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
      startY: 100,
      head: [
        [
          "#",
          "Description",
          "Code",
          "Qty",
          "Unit Price",
          "GST",
          "GST Amount",
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
        6: { cellWidth: 30 }, // GST Amount
        7: { cellWidth: 30 }, // Total
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

// Add new function for Delivery Document
export const generateAndDownloadDeliveryDocument = async (
  quotation: Quotation
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("DELIVERY DOCUMENT", 105, 20, { align: "center" });

    // Company Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Your Company Name", 14, 35);
    doc.text("Company Address Line 1", 14, 40);
    doc.text("Company Address Line 2", 14, 45);
    doc.text("Phone: (123) 456-7890", 14, 50);

    // Document Info (right aligned)
    doc.text(
      `Delivery Document #: ${quotation.quotation_number}-DEL`,
      180,
      35,
      {
        align: "right",
      }
    );
    doc.text(`Date: ${getDateFormatted(new Date().toISOString())}`, 180, 40, {
      align: "right",
    });
    doc.text(`Quotation #: ${quotation.quotation_number}`, 180, 45, {
      align: "right",
    });

    // Customer Info
    const customer = quotation.customers as any; // TODO: fix
    doc.setFont("helvetica", "bold");
    doc.text("DELIVER TO:", 14, 65);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 70);
    doc.text(customer?.address || "", 14, 75);
    if (customer?.suburb) {
      doc.text(
        `${customer.suburb} ${customer.state} ${customer.post_code}`,
        14,
        80
      );
    }
    doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 85);
    doc.text(`Mobile: ${customer?.mobile || "N/A"}`, 14, 90);

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
      startY: 100,
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
        4: { cellWidth: 40 },
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

// Update the openQuotationPDFInNewTab function to include GST
export const openQuotationPDFInNewTab = async (
  quotation: Quotation
): Promise<void> => {
  try {
    // Create a Blob URL for the PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", 105, 20, { align: "center" });

    // Company Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Your Company Name", 14, 35);
    doc.text("Company Address Line 1", 14, 40);
    doc.text("Company Address Line 2", 14, 45);
    doc.text("Phone: (123) 456-7890 | Email: info@company.com", 14, 50);

    // Quotation Info (right aligned)
    doc.setFont("helvetica", "normal");
    doc.text(`Quotation #: ${quotation.quotation_number}`, 180, 35, {
      align: "right",
    });
    doc.text(`Date: ${getDateFormatted(quotation.created_at)}`, 180, 40, {
      align: "right",
    });
    doc.text(
      `Valid Until: ${
        quotation.valid_until ? getDateFormatted(quotation.valid_until) : "N/A"
      }`,
      180,
      45,
      { align: "right" }
    );

    // Customer Info
    const customer = quotation.customers;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 65);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 70);
    doc.text(customer?.address || "", 14, 75);
    if (customer?.suburb) {
      doc.text(
        `${customer.suburb} ${customer.state} ${customer.post_code}`,
        14,
        80
      );
    }
    doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 85);
    doc.text(`Email: ${customer?.email || "N/A"}`, 14, 90);

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
        `$${gstAmount.toFixed(2)}`,
        `$${totalWithGST.toFixed(2)}`,
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
      startY: 100,
      head: [
        [
          "#",
          "Description",
          "Code",
          "Qty",
          "Unit Price",
          "GST",
          "GST Amount",
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
        6: { cellWidth: 30 }, // GST Amount
        7: { cellWidth: 30 }, // Total
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
