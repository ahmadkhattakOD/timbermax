// utils/pdfGenerator.ts
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import QuotationPDF from 'components/quotation-pdf';
import { Quotation, PDFGenerationResult } from 'types';

/**
 * Generates and downloads a PDF for the given quotation
 */
export const generateAndDownloadQuotationPDF = async (
  quotation: Quotation
): Promise<PDFGenerationResult> => {
  try {
    // Validate quotation data
    if (!quotation) {
      throw new Error('Quotation data is required');
    }

    if (!quotation.quotation_number) {
      throw new Error('Quotation number is required');
    }

    // Create PDF blob with error handling
    const blob = await pdf(<QuotationPDF quotation={quotation} />).toBlob();
    
    if (!blob || blob.size === 0) {
      throw new Error('Failed to generate PDF blob');
    }

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const safeQuotationNumber = quotation.quotation_number.replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `Quotation_${safeQuotationNumber}_${date}.pdf`;

    // Save the file
    saveAs(blob, fileName);

    return {
      success: true,
      fileName,
    };
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Generates PDF blob for preview purposes
 */
export const generateQuotationPDFBlob = async (
  quotation: Quotation
): Promise<Blob> => {
  if (!quotation) {
    throw new Error('Quotation data is required');
  }

  return await pdf(<QuotationPDF quotation={quotation} />).toBlob();
};

/**
 * Opens PDF in a new browser tab
 */
export const openQuotationPDFInNewTab = async (quotation: Quotation): Promise<void> => {
  try {
    const blob = await generateQuotationPDFBlob(quotation);
    const url = URL.createObjectURL(blob);
    
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    
    // Clean up URL after window opens
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error opening PDF:', error);
    throw error;
  }
};