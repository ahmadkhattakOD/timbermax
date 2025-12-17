// components/QuotationPDF.tsx
import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  Image,
  Link 
} from '@react-pdf/renderer';
import { Quotation, Customer, QuotationItem } from 'types';

// Register fonts with proper typing
Font.register({
  family: 'Helvetica',
  fonts: [
    { 
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
      fontWeight: 'normal' as const 
    },
    { 
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2',
      fontWeight: 'bold' as const 
    },
  ],
});

// Define styles with proper TypeScript typing
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column' as const,
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #3B82F6',
    paddingBottom: 15,
  },
  companyInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#1E40AF',
  },
  quotationTitle: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginVertical: 20,
    color: '#111827',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    marginBottom: 8,
    color: '#374151',
    backgroundColor: '#F3F4F6',
    padding: 6,
    textTransform: 'uppercase' as const,
  },
  twoColumn: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: '#111827',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  tableRow: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    minHeight: 30,
    alignItems: 'center' as const,
  },
  tableHeader: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontWeight: 'bold' as const,
    fontSize: 11,
  },
  tableCol: {
    padding: 8,
    fontSize: 10,
  },
  col1: { width: '8%' },
  col2: { width: '42%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '20%' },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  notes: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 1.5,
    maxWidth: '60%',
  },
  totalSection: {
    alignItems: 'flex-end' as const,
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: 200,
    marginBottom: 5,
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#1E40AF',
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#111827',
    paddingTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold' as const,
  },
  pageNumber: {
    position: 'absolute' as const,
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center' as const,
    color: '#6B7280',
    fontSize: 9,
  },
});

interface QuotationPDFProps {
  quotation: Quotation;
}

const QuotationPDF: React.FC<QuotationPDFProps> = ({ quotation }) => {
  // Calculate totals with proper typing
  const subtotal = quotation.quotation_items?.reduce(
    (sum: number, item: QuotationItem) => sum + (item.total_price || 0), 
    0
  ) || 0;
  
  const taxRate = quotation.tax_rate || 0.10;
  const tax = quotation.tax || subtotal * taxRate;
  const grandTotal = quotation.total || subtotal + tax;

  // Format currency with proper typing
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date with null checking
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Get status color
  const getStatusColor = (status: Quotation['status']): string => {
    const colors: Record<Quotation['status'], string> = {
      'accepted': '#10B981',
      'sent': '#3B82F6',
      'draft': '#F59E0B',
      'cancelled': '#EF4444',
      'converted': '#8B5CF6'
    };
    return colors[status] || '#6B7280';
  };

  // Get status display text
  const getStatusText = (status: Quotation['status']): string => {
    const texts: Record<Quotation['status'], string> = {
      'accepted': 'Accepted',
      'sent': 'Sent',
      'draft': 'Draft',
      'cancelled': 'Cancelled',
      'converted': 'Converted to Invoice'
    };
    return texts[status] || status;
  };

  // Format customer address
  const formatCustomerAddress = (customer?: Customer): string => {
    if (!customer) return 'N/A';
    
    const parts: string[] = [];
    if (customer.company) parts.push(customer.company);
    if (customer.address) parts.push(customer.address);
    return parts.join(', ') || 'Address not provided';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <View>
              <Text style={styles.companyName}>YOUR COMPANY NAME</Text>
              <Text style={styles.label}>123 Business Street</Text>
              <Text style={styles.label}>Sydney NSW 2000, Australia</Text>
              <Text style={styles.label}>Phone: (02) 1234 5678</Text>
              <Text style={styles.label}>Email: info@company.com</Text>
              <Text style={styles.label}>ABN: 12 345 678 901</Text>
            </View>
            <View>
              <Text style={[styles.label, { textAlign: 'right' as const }]}>
                QUOTATION
              </Text>
              <Text style={[styles.value, { textAlign: 'right' as const }]}>
                #{quotation.quotation_number}
              </Text>
              <View style={{ 
                backgroundColor: getStatusColor(quotation.status),
                ...styles.statusBadge,
                marginTop: 5,
                alignSelf: 'flex-end' as const 
              }}>
                <Text style={{ color: '#FFFFFF' }}>
                  {getStatusText(quotation.status)}
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.quotationTitle}>QUOTATION</Text>
        </View>

        {/* Quotation Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUOTATION DETAILS</Text>
          <View style={styles.twoColumn}>
            <View>
              <Text style={styles.label}>Quotation Date</Text>
              <Text style={styles.value}>{formatDate(quotation.created_at)}</Text>
            </View>
            {/* <View>
              <Text style={styles.label}>Valid Until</Text>
              <Text style={styles.value}>{formatDate(quotation.valid_until)}</Text>
            </View> */}
          </View>
          <View style={styles.twoColumn}>
            <View>
              <Text style={styles.label}>Reference</Text>
              <Text style={styles.value}>{quotation.reference || 'N/A'}</Text>
            </View>
            <View>
              <Text style={styles.label}>Tax Rate</Text>
              <Text style={styles.value}>{((taxRate || 0.10) * 100).toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Customer Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <View>
            <Text style={styles.value}>{quotation.customer?.name || 'N/A'}</Text>
            <Text style={styles.label}>{formatCustomerAddress(quotation.customer)}</Text>
            {quotation.customer?.email && (
              <Text style={styles.label}>Email: {quotation.customer.email}</Text>
            )}
            {quotation.customer?.phone && (
              <Text style={styles.label}>Phone: {quotation.customer.phone}</Text>
            )}
            {quotation.customer?.abn && (
              <Text style={styles.label}>ABN: {quotation.customer.abn}</Text>
            )}
          </View>
        </View>

        {/* Items Table Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ITEMS</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, styles.col1]}>#</Text>
              <Text style={[styles.tableCol, styles.col2]}>Description</Text>
              <Text style={[styles.tableCol, styles.col3]}>Quantity</Text>
              <Text style={[styles.tableCol, styles.col4]}>Unit Price</Text>
              <Text style={[styles.tableCol, styles.col5]}>Total</Text>
            </View>
            
            {/* Table Rows */}
            {quotation.quotation_items?.map((item: QuotationItem, index: number) => (
              <View key={`item-${item.id || index}`} style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.col1]}>{index + 1}</Text>
                <Text style={[styles.tableCol, styles.col2]}>
                  {item.items?.name || 'Unnamed Item'}
                  {item.items?.itemCode && `\nCode: ${item.items.itemCode}`}
                  {item.description && `\n${item.description}`}
                </Text>
                <Text style={[styles.tableCol, styles.col3, { textAlign: 'center' as const }]}>
                  {item.quantity || 0}
                </Text>
                <Text style={[styles.tableCol, styles.col4, { textAlign: 'right' as const }]}>
                  {formatCurrency(item.unit_price || 0)}
                </Text>
                <Text style={[styles.tableCol, styles.col5, { textAlign: 'right' as const }]}>
                  {formatCurrency(item.total_price || 0)}
                </Text>
              </View>
            ))}
            
            {/* Empty state */}
            {(!quotation.quotation_items || quotation.quotation_items.length === 0) && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, { width: '100%', textAlign: 'center' as const }]}>
                  No items in this quotation
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Totals Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text style={styles.value}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Tax ({((taxRate || 0.10) * 100).toFixed(1)}%):</Text>
            <Text style={styles.value}>{formatCurrency(tax)}</Text>
          </View>
          {quotation.total !== undefined && (
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotal}>Grand Total:</Text>
              <Text style={styles.grandTotal}>{formatCurrency(grandTotal)}</Text>
            </View>
          )}
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <View style={styles.notes}>
            <Text style={[styles.label, { marginBottom: 5, fontWeight: 'bold' as const }]}>
              Notes:
            </Text>
            <Text>
              {quotation.note || 
                'Thank you for your business. This quotation is valid until the date specified above. ' +
                'Prices are in Australian Dollars (AUD).'}
            </Text>
            <Text style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: 'bold' as const }}>Terms & Conditions:</Text>{' '}
              {quotation.terms || 
                'Payment is due within 30 days of invoice date. Late payments are subject to a ' +
                'monthly service charge of 1.5%. All goods remain the property of the seller until ' +
                'paid in full.'}
            </Text>
          </View>
          <View>
            <Text style={[styles.label, { marginBottom: 20 }]}>
              Authorized Signature
            </Text>
            <Text style={[styles.label, { marginTop: 30 }]}>
              _________________________
            </Text>
            <Text style={[styles.label, { fontSize: 9, marginTop: 5 }]}>
              Date: {formatDate(new Date().toISOString())}
            </Text>
          </View>
        </View>

        {/* Page Number */}
        <Text style={styles.pageNumber} fixed>
          Page 1 of 1 • Generated on {formatDate(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  );
};

export default QuotationPDF;