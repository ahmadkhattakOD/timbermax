import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
} from "@react-pdf/renderer";

interface SaleData {
  contactName: string;
  opportunity: string;
  deposit: string;
  total: string;
  paymentMethod: string;
  salesPerson: string;
  closer: string;
  note: string;
  status: string;
  show: string;
  comms: string;
  saleDate: string;
}

interface TableProps {
  data: SaleData[];
}

// Create styles
const styles = StyleSheet.create({
  table: {
    display: "flex",
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap'
  },
});

// Create table component
const Table: React.FC<TableProps> = ({ data }) => (
  <View style={styles.table}>
    {/* Table Header */}
    <View style={styles.tableRow}>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Contact Name</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Opp. Descr.</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Deposit</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Total</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Payment Method</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Sales Person</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Closer</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Note</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Status</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Show</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Comms</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>Sale Date</Text>
      </View>
    </View>
    {/* Table Content */}
    {data.map((row, index) => (
      <View style={styles.tableRow} key={index}>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.contactName}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.opportunity}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.deposit}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.total}</Text>
        </View>
      </View>
    ))}
  </View>
);

interface MyDocumentProps {
  data: SaleData[];
}

const MyDocument: React.FC<MyDocumentProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={{ padding: 30 }} orientation="landscape">
      <Text style={{ marginBottom: 20, fontSize: 15 }}>My Table</Text>
      <Table data={data} />
    </Page>
  </Document>
);

const PDFInvoice: React.FC = () => {
  const data: SaleData[] = [
    // {
    //   col1: "Row 1, Col 1",
    //   col2: "Row 1, Col 2",
    //   col3: "Row 1, Col 3",
    //   col4: "Row 1, Col 4",
    // },
    // {
    //   col1: "Row 2, Col 1",
    //   col2: "Row 2, Col 2",
    //   col3: "Row 2, Col 3",
    //   col4: "Row 2, Col 4",
    // },
    // Add more rows as needed
  ];

  return <MyDocument data={data} />;
};

export default PDFInvoice;
