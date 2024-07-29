import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import Locales from "components/Locales";
import logo from "../../../assets/images/icons/ultramatic.png";
import paidStamp from "../../../assets/images/icons/paid-stamp.png";
import pendingStamp from "../../../assets/images/icons/pending-stamp.png";
import { getDateFormatted } from "utils/helpers";
import { FormattedMessage } from "react-intl";

export interface PDFInvoiceData {
  wages: string;
  travelBonus: string;
  otherBonuses: string;
  totalCommission: string;
  cancelledSales: string;
  deductions: string;
}

interface TableProps {
  wages: string;
  travelBonus: string;
  otherBonuses: string;
  totalCommission: string;
  cancelledSales: string;
  deductions: string;
  total: string;
}

// export interface PDFSalesData {
//   contactName: string;
//   deposit: string;
//   total: string;
//   sales_person: any;
//   closer: string;
//   status: string;
//   show: string;
//   comms: string;
//   saleDate: string;
// }

interface SalesTableProps {
  data: any[];
}

interface PDFInvoiceProps {
  createdAt: string;
  fullName: string;
  wages: string;
  travelBonus: string;
  otherBonuses: string;
  deductions: string;
  cancelledSales: string;
  totalCommission: string;
  total: string;
  role: string;
  startDate: string;
  endDate: string;
  status: string;
  salesData: any[];
  cancelledData: any[];
}

interface TableHeaderProps {
  createdAt: string;
  fullName: string;
  role: string;
  startDate: string;
  endDate: string;
}

const styles = StyleSheet.create({
  table: {
    display: "flex",
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
  },
  tableRow: {
    flexDirection: "column",
  },
  tableCol: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
  },
  tableCell: {
    fontSize: 10,
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
    padding: 5,
  },
  tableCellBold: {
    fontSize: 10,
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
    padding: 5,
    fontWeight: 800,
  },
  tableCellAlignRight: {
    fontSize: 10,
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
    padding: 5,
    textAlign: "right",
  },
  tableCellAlignRightBold: {
    fontSize: 10,
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
    padding: 5,
    textAlign: "right",
    fontWeight: 800,
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
    height: "100px",
    width: "100px",
  },
  stamp: {
    width: "40%",
    objectFit: "fit-width",
  },
  logoWithColumnLayout: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "20px",
  },
  stampLayout: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "50px",
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
  headerName: {
    fontSize: 16,
    color: "#0A5394",
  },
  headerRole: {
    fontSize: 12,
    color: "#000",
  },
  headerDates: {
    fontSize: 10,
    color: "#787878",
  },
  allContent: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  topContent: {
    display: "flex",
    flexDirection: "column",
  },
  footerContent: {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
  },
  footerDivider: {
    width: "100%",
    color: "#787878",
    borderTop: "1px solid #787878",
    paddingBottom: "10px",
    opacity: 0.2,
  },
  footerText: {
    fontSize: 8,
    color: "#787878",
  },
  verticalTable: {
    display: "flex",
    flexDirection: "column",
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
  },
  verticalTableRow: {
    flexDirection: "row",
  },
  verticalTableCol: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#D3D3D3",
    padding: 5,
  },
  verticalTableCell: {
    fontSize: 10,
    flexDirection: "row",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
  },
  secondaryTitle: {
    fontSize: 12,
    color: "#0A5394",
    paddingBottom: 20,
  },
});

const Table: React.FC<TableProps> = ({
  wages,
  travelBonus,
  otherBonuses,
  totalCommission,
  cancelledSales,
  deductions,
  total,
}) => (
  <View style={styles.table}>
    {/* Table Header and Content */}
    <View style={styles.tableCol}>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Wages (A$)</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Travel Bonus (A$)</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Other Bonuses (A$)</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Total Commission (A$)</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Cancelled Sales (A$)</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Deductions (A$)</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCellBold}>Total (A$)</Text>
      </View>
    </View>
    <View style={styles.tableCol}>
      <View style={styles.tableRow}>
        <Text style={styles.tableCellAlignRight}>{wages}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCellAlignRight}>{travelBonus}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCellAlignRight}>{otherBonuses}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCellAlignRight}>{totalCommission}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCellAlignRight}>{cancelledSales}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCellAlignRight}>{deductions}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCellAlignRightBold}>{total}</Text>
      </View>
    </View>
  </View>
);

const VerticalTableSales: React.FC<SalesTableProps> = ({ data }) => (
  <View style={styles.verticalTable}>
    {/* Table Header */}
    <View style={styles.verticalTableRow}>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Contact Name</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Deposit</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Total</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Sales Person</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Closer</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Status</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Show</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Comms</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Sale Date</Text>
      </View>
    </View>
    {/* Table Content */}
    {data.map((row, index) => (
      <View style={styles.verticalTableRow} key={index}>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.customer?.name ?? ""}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.deposit}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.total}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>
            {row.sales_person?.full_name}
          </Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.closer?.full_name}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>
            <FormattedMessage id={row.status} />
          </Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.show_name}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.commission}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>
            {row.sale_date && getDateFormatted(row.sale_date)}
          </Text>
        </View>
      </View>
    ))}
  </View>
);

const VerticalTableCancelled: React.FC<SalesTableProps> = ({ data }) => (
  <View style={styles.verticalTable}>
    {/* Table Header */}
    <View style={styles.verticalTableRow}>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Contact Name</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Deposit</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Total</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Sales Person</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Closer</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Comms</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Sale Date</Text>
      </View>
      <View style={styles.verticalTableCol}>
        <Text style={styles.verticalTableCell}>Cancellation Date</Text>
      </View>
    </View>
    {/* Table Content */}
    {data.map((row, index) => (
      <View style={styles.verticalTableRow} key={index}>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.customer?.name ?? ""}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.deposit}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.total}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>
            {row.sales_person?.full_name}
          </Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.closer?.full_name}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>{row.commission}</Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>
            {row.sale_date && getDateFormatted(row.sale_date)}
          </Text>
        </View>
        <View style={styles.verticalTableCol}>
          <Text style={styles.verticalTableCell}>
            {row.status_changed_at && getDateFormatted(row.status_changed_at)}
          </Text>
        </View>
      </View>
    ))}
  </View>
);

const Header: React.FC<TableHeaderProps> = ({
  createdAt,
  fullName,
  role,
  startDate,
  endDate,
}) => (
  <View style={styles.headerWithBorderLayout}>
    <View style={styles.headerBorder}>
      <Text style={styles.invoiceDateText}>Invoice Date {createdAt}</Text>
    </View>
    <View style={styles.headerLayout}>
      <View style={styles.logoWithColumnLayout}>
        <Image source={logo} style={styles.logo}></Image>
      </View>
      <View style={[styles.columnLayout, styles.rightColumn]}>
        <Text style={styles.headerName}>{fullName}</Text>
        <Text style={styles.headerRole}>{role}</Text>
        <Text style={styles.headerDates}>From: {startDate}</Text>
        <Text style={styles.headerDates}>Till: {endDate}</Text>
      </View>
    </View>
    <View style={styles.headerBorder}></View>
  </View>
);

const PDFDownload: React.FC<PDFInvoiceProps> = ({
  createdAt,
  fullName,
  wages,
  travelBonus,
  otherBonuses,
  deductions,
  cancelledSales,
  totalCommission,
  total,
  role,
  startDate,
  endDate,
  status,
  salesData,
  cancelledData,
}) => {
  return (
    <Locales>
      <Document>
        <Page size="A4" style={{ padding: 30 }} orientation="portrait">
          <View style={styles.allContent}>
            <View style={styles.topContent}>
              <Header
                createdAt={createdAt}
                fullName={fullName}
                role={role}
                startDate={startDate}
                endDate={endDate}
              />
              <Table
                wages={wages}
                travelBonus={travelBonus}
                otherBonuses={otherBonuses}
                deductions={deductions}
                cancelledSales={cancelledSales}
                totalCommission={totalCommission}
                total={total}
              />
              {status === "paid" ? (
                <View style={styles.stampLayout}>
                  <Image source={paidStamp} style={styles.stamp}></Image>
                </View>
              ) : (
                <View style={styles.stampLayout}>
                  <Image source={pendingStamp} style={styles.stamp}></Image>
                </View>
              )}
            </View>
            <View style={styles.footerContent}>
              <View style={styles.footerDivider}></View>
              <Text style={styles.footerText}>
                This is a computer generated document and does not require any
                signatures to verify its validity. For more information, visit
                www.ultramatic.com.au or contact us at info@ultramatic.com.au
              </Text>
            </View>
          </View>
        </Page>
        {salesData.length > 0 && (
          <Page size="A4" style={{ padding: 30 }} orientation="portrait">
            <Text style={styles.secondaryTitle}>Sales</Text>
            <VerticalTableSales data={salesData} />
          </Page>
        )}
        {cancelledData.length > 0 && (
          <Page size="A4" style={{ padding: 30 }} orientation="portrait">
            <Text style={styles.secondaryTitle}>Cancelled Sales</Text>
            <VerticalTableCancelled data={cancelledData} />
          </Page>
        )}
      </Document>
    </Locales>
  );
};

export default PDFDownload;
