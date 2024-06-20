import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 30,
  },
  section: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableCol: {
    width: "16%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  detailSection: {
    padding: 10,
    borderStyle: "solid",
    borderWidth: 1,
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 5,
  },
});

// Create Document Component
const PDFInvoice: React.FC = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text>Sale Start Date : 28/Apr/24</Text>
          <Text>End Date : 3/May/24</Text>
        </View>
        <View>
          <Text>Role : Sales Person</Text>
          <Text>Name : Chloe Butterworth</Text>
          <Text>Include Canceled after Delivery</Text>
        </View>
      </View>
      <Text style={styles.title}>Invoice Date : 17/Jun/2024</Text>
      <View style={styles.detailSection}>
        <Text style={styles.detailItem}>Name: Chloe Butterworth</Text>
        <Text style={styles.detailItem}>Wages: $0</Text>
        <Text style={styles.detailItem}>Number of Show Days: ...........</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Travel Bonus</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>$0.00</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Other Bonuses</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>$0.00</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Deductions</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>$0.00</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Cancelled Sales</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>$0.00</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Total</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>$0.00</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Commission</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>$0.00</Text>
          </View>
        </View>
      </View>
      <Text style={styles.title}>TOTAL: $0.00</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Contact Name</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Opportunity Description</Text>
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
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>No data</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export default PDFInvoice;
