import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image,
} from "@react-pdf/renderer";
import { FormattedMessage, IntlProvider } from "react-intl";
import Locales from "components/Locales";
import logo from "../../../assets/images/icons/ultramatic.png";
import { getDateFormatted } from "utils/helpers";

export interface PDFInvoiceData {
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
  data: PDFInvoiceData[];
}

interface PDFInvoiceProps {
  data: PDFInvoiceData[];
  fullName: string;
  wages: string;
  numberOfShowDays: string;
  travelBonus: string;
  otherBonuses: string;
  deductions: string;
  cancelledSales: string;
  totalCommission: string;
  total: string;
}

interface TableHeaderProps {
  fullName: string;
  wages: string;
  numberOfShowDays: string;
  travelBonus: string;
  otherBonuses: string;
  deductions: string;
  cancelledSales: string;
  totalCommission: string;
  total: string;
}

const styles = StyleSheet.create({
  table: {
    display: "flex",
    flexDirection: "column",
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCol: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
    flexDirection: "row",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
  },
  headerWithBorderLayout: {
    display: "flex",
    flexDirection: "column",
    paddingBottom: "20px",
  },
  headerBorder: {
    height: "20px",
    backgroundColor: "#0A5394",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  invoiceDateText: {
    color: "#FFF",
    fontSize: 12,
    paddingLeft: 8,
  },
  logo: {
    height: "50px",
    width: "50px",
  },
  logoWithColumnLayout: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "20px",
  },
  headerLayout: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#DDE7F9",
    padding: "20px",
  },
  columnLayout: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  rightColumn: {
    alignItems: "flex-end",
  },
  headerLabel: {
    fontSize: 12,
    color: "#0A5394",
  },
  headerValue: {
    fontSize: 12,
    color: "#000",
  },
});

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
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>
            <FormattedMessage id={row.paymentMethod} />
          </Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.salesPerson}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.closer}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.note}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>
            <FormattedMessage id={row.status} />
          </Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.show}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.comms}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableCell}>{row.saleDate}</Text>
        </View>
      </View>
    ))}
  </View>
);

const Header: React.FC<TableHeaderProps> = ({
  fullName,
  wages,
  numberOfShowDays,
  travelBonus,
  otherBonuses,
  deductions,
  cancelledSales,
  totalCommission,
  total,
}) => (
  <View style={styles.headerWithBorderLayout}>
    <View style={styles.headerBorder}>
      <Text style={styles.invoiceDateText}>
        Invoice Date {getDateFormatted()}
      </Text>
    </View>
    <View style={styles.headerLayout}>
      <View style={styles.logoWithColumnLayout}>
        <Image source={logo} style={styles.logo}></Image>
        <View style={styles.columnLayout}>
          <Text style={styles.headerLabel}>
            Name <Text style={styles.headerValue}>{fullName}</Text>
          </Text>
          <Text style={styles.headerLabel}>
            Wages <Text style={styles.headerValue}>{wages}</Text>
          </Text>
          <Text style={styles.headerLabel}>
            Number of Show Days{" "}
            <Text style={styles.headerValue}>{numberOfShowDays}</Text>
          </Text>
        </View>
      </View>
      <View style={[styles.columnLayout, styles.rightColumn]}>
        <Text style={styles.headerLabel}>
          Travel Bonus <Text style={styles.headerValue}>{travelBonus}</Text>
        </Text>
        <Text style={styles.headerLabel}>
          Other Bonuses <Text style={styles.headerValue}>{otherBonuses}</Text>
        </Text>
        <Text style={styles.headerLabel}>
          Deductions <Text style={styles.headerValue}>({deductions})</Text>
        </Text>
        <Text style={styles.headerLabel}>
          Cancelled Sales{" "}
          <Text style={styles.headerValue}>({cancelledSales})</Text>
        </Text>
        <Text style={styles.headerLabel}>
          Total Commission{" "}
          <Text style={styles.headerValue}>{totalCommission}</Text>
        </Text>
        <Text style={styles.headerLabel}>
          Total <Text style={styles.headerValue}>{total}</Text>
        </Text>
      </View>
    </View>
    <View style={styles.headerBorder}></View>
  </View>
);

const PDFInvoice: React.FC<PDFInvoiceProps> = ({
  data,
  fullName,
  wages,
  numberOfShowDays,
  travelBonus,
  otherBonuses,
  deductions,
  cancelledSales,
  totalCommission,
  total,
}) => {
  return (
    <Locales>
      <Document>
        <Page size="A4" style={{ padding: 30 }} orientation="landscape">
          <Header
            fullName={fullName}
            wages={wages}
            numberOfShowDays={numberOfShowDays}
            travelBonus={travelBonus}
            otherBonuses={otherBonuses}
            deductions={deductions}
            cancelledSales={cancelledSales}
            totalCommission={totalCommission}
            total={total}
          />
          <Table data={data} />
        </Page>
      </Document>
    </Locales>
  );
};

export default PDFInvoice;
