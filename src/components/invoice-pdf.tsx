// utils/pdf-generator/invoicePdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getDateFormatted } from "utils/helpers";

export interface InvoiceForPDF {
  id: number;
  invoice_number: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    suburb?: string;
    state?: string;
    post_code?: string;
  };
  quotation_id?: number | null;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  delivery_status?: 'pending' | 'packed' | 'shipped' | 'delivered' | 'returned';
  invoice_date: string;
  note?: string;
  created_at: string;
  invoice_items?: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    total_price?: number;
    items?: {
      name?: string;
      itemCode?: string;
      gst?: boolean;
    };
  }>;
}

export const generateAndDownloadInvoicePDF = async (
  invoice: InvoiceForPDF
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 105, 20, { align: "center" });

    // Company Info (Left side)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SENDER", 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text("Your Company Name", 14, 40);
    doc.text("123 Business Street", 14, 45);
    doc.text("Melbourne VIC 3000", 14, 50);
    doc.text("Phone: (03) 1234 5678", 14, 55);
    doc.text("Email: info@company.com", 14, 60);
    doc.text("ABN: 12 345 678 901", 14, 65);

    // Invoice Info (Right side)
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE DETAILS", 180, 35, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${invoice.invoice_number}`, 180, 40, {
      align: "right",
    });
    doc.text(`Date: ${getDateFormatted(invoice.invoice_date)}`, 180, 45, {
      align: "right",
    });
    doc.text(`Status: ${invoice.status?.toUpperCase()}`, 180, 50, {
      align: "right",
    });
    if (invoice.delivery_status) {
      doc.text(`Delivery: ${invoice.delivery_status?.toUpperCase()}`, 180, 55, {
        align: "right",
      });
    }
    if (invoice.quotation_id) {
      doc.text(`Ref Quote: ${invoice.quotation_id}`, 180, 60, {
        align: "right",
      });
    }

    // Customer Info
    const customer = invoice.customer;
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 80);
    doc.setFont("helvetica", "normal");
    doc.text(customer?.name || "N/A", 14, 85);
    doc.text(customer?.address || "", 14, 90);
    if (customer?.suburb) {
      doc.text(
        `${customer.suburb} ${customer.state} ${customer.post_code}`,
        14,
        95
      );
    }
    doc.text(`Phone: ${customer?.phone || "N/A"}`, 14, 100);
    doc.text(`Mobile: ${customer?.mobile || "N/A"}`, 14, 105);
    doc.text(`Email: ${customer?.email || "N/A"}`, 14, 110);

    // Items Table
    const items = invoice.invoice_items || [];
    const tableData = items.map((item: any, index: number) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
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
        gst ? "10%" : "0%",
        `$${gstAmount.toFixed(2)}`,
        `$${totalWithGST.toFixed(2)}`,
      ];
    });

    // Calculate totals
    let totalBaseAmount = 0;
    let totalGSTAmount = 0;
    let grandTotal = 0;

    items.forEach((item: any) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const baseTotal = quantity * unitPrice;
      const gst = item.items?.gst || false;
      const gstAmount = gst ? baseTotal * 0.1 : 0;

      totalBaseAmount += baseTotal;
      totalGSTAmount += gstAmount;
      grandTotal += baseTotal + gstAmount;
    });

    autoTable(doc, {
      startY: 120,
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
    doc.text("PAYMENT SUMMARY", 120, finalY);

    doc.setFont("helvetica", "normal");
    doc.text(`Subtotal:`, 120, finalY + 10);
    doc.text(`GST:`, 120, finalY + 20);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Due:`, 120, finalY + 30);

    doc.text(`$${totalBaseAmount.toFixed(2)}`, 180, finalY + 10, {
      align: "right",
    });
    doc.text(`$${totalGSTAmount.toFixed(2)}`, 180, finalY + 20, {
      align: "right",
    });
    doc.text(`$${grandTotal.toFixed(2)}`, 180, finalY + 30, {
      align: "right",
    });

    // Payment Terms
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT TERMS:", 14, finalY + 50);
    doc.setFont("helvetica", "normal");
    doc.text("Please pay within 30 days of invoice date.", 14, finalY + 55);
    doc.text("Bank Details:", 14, finalY + 60);
    doc.text("Bank: Your Bank Name", 14, finalY + 65);
    doc.text("BSB: 123-456", 14, finalY + 70);
    doc.text("Account: 12345678", 14, finalY + 75);
    doc.text("Reference: " + invoice.invoice_number, 14, finalY + 80);

    // Notes Section
    if (invoice.note) {
      doc.setFont("helvetica", "bold");
      doc.text("NOTES:", 14, finalY + 95);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(invoice.note, 180);
      doc.text(splitNotes, 14, finalY + 100);
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Thank you for your business!",
      105,
      doc.internal.pageSize.height - 20,
      { align: "center" }
    );
    doc.setFont("helvetica", "normal");
    doc.text(
      "This is a computer-generated invoice. No signature required.",
      105,
      doc.internal.pageSize.height - 15,
      { align: "center" }
    );

    const fileName = `invoice_${invoice.invoice_number}_${getDateFormatted(
      new Date().toISOString()
    )}.pdf`;

    doc.save(fileName);

    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating invoice PDF:", error);
    return { success: false, error: error.message };
  }
};

export const openInvoicePDFInNewTab = async (
  invoice: InvoiceForPDF
): Promise<void> => {
  try {
    const doc = new jsPDF();

    // Same PDF generation as above...
    // Copy the generateAndDownloadInvoicePDF logic but use output('blob')
    
    // ... [copy all the PDF generation logic from generateAndDownloadInvoicePDF]
    
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    window.open(pdfUrl, "_blank");

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
  } catch (error: any) {
    console.error("Error opening invoice PDF:", error);
    throw error;
  }
};

export const generateDeliveryNotePDF = async (
  invoice: InvoiceForPDF
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("DELIVERY NOTE", 105, 20, { align: "center" });

    // Company Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("From: Your Company Name", 14, 35);
    doc.text("123 Business Street", 14, 40);
    doc.text("Melbourne VIC 3000", 14, 45);
    doc.text("Phone: (03) 1234 5678", 14, 50);

    // Delivery Info
    doc.setFont("helvetica", "normal");
    doc.text(`Delivery Note #: ${invoice.invoice_number}-DEL`, 180, 35, {
      align: "right",
    });
    doc.text(`Date: ${getDateFormatted(new Date().toISOString())}`, 180, 40, {
      align: "right",
    });
    doc.text(`Invoice #: ${invoice.invoice_number}`, 180, 45, {
      align: "right",
    });
    doc.text(`Status: ${invoice.delivery_status?.toUpperCase() || "PENDING"}`, 180, 50, {
      align: "right",
    });

    // Customer Info
    const customer = invoice.customer;
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

    // Items Table (simplified for delivery)
    const items = invoice.invoice_items || [];
    const tableData = items.map((item: any, index: number) => {
      const quantity = parseFloat(item.quantity) || 0;
      return [
        index + 1,
        item.items?.name || "N/A",
        item.items?.itemCode || "N/A",
        quantity.toFixed(2),
        "PENDING", // Received status
      ];
    });

    autoTable(doc, {
      startY: 100,
      head: [["#", "Item Description", "Code", "Quantity", "Received"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [34, 139, 34], textColor: 255 }, // Green
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
    doc.text("DELIVERY INSTRUCTIONS:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.text("1. Check all items against this delivery note.", 14, finalY + 10);
    doc.text("2. Report any discrepancies immediately.", 14, finalY + 15);
    doc.text("3. Ensure packaging is intact.", 14, finalY + 20);

    // Signature Section
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER SIGNATURE:", 14, finalY + 40);
    doc.line(14, finalY + 45, 100, finalY + 45);
    doc.text("Name: ____________________", 14, finalY + 50);
    doc.text("Date: ____________________", 14, finalY + 55);

    doc.text("DELIVERY PERSON:", 120, finalY + 40);
    doc.line(120, finalY + 45, 180, finalY + 45);
    doc.text("Name: ____________________", 120, finalY + 50);
    doc.text("Date: ____________________", 120, finalY + 55);

    // Footer
    doc.setFontSize(8);
    doc.text(
      "This document serves as proof of delivery.",
      105,
      doc.internal.pageSize.height - 20,
      { align: "center" }
    );

    const fileName = `delivery_note_${invoice.invoice_number}_${getDateFormatted(
      new Date().toISOString()
    )}.pdf`;

    doc.save(fileName);

    return { success: true, fileName };
  } catch (error: any) {
    console.error("Error generating delivery note:", error);
    return { success: false, error: error.message };
  }
};