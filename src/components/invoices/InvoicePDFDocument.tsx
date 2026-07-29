import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { CompanyProfile, defaultCompanyProfile } from "@/lib/companyProfile";
import { formatClientAddress } from "@/lib/pdfUtils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  logo: {
    width: 72,
    height: 36,
    objectFit: "contain",
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#111",
  },
  invoiceDetails: {
    textAlign: "right",
  },
  companyName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  companyMeta: {
    fontSize: 8,
    color: "#555",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
    color: "#555",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  clientBox: {
    width: "45%",
  },
  ourBox: {
    width: "45%",
    textAlign: "right",
  },
  textBold: {
    fontFamily: "Helvetica-Bold",
  },
  table: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
    marginBottom: 20,
    marginTop: 10,
  },
  tr: {
    flexDirection: "row",
  },
  tdBase: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    paddingVertical: 6,
    paddingHorizontal: 6,
    justifyContent: "center",
  },
  th: {
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    backgroundColor: "#f5f5f5",
  },
  colDesc: { width: "45%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  summaryBox: {
    width: "40%",
    alignSelf: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: "#333",
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#777",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  notesBox: {
    marginTop: 20,
    width: "60%",
  },
  notesTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
});

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const InvoicePDFDocument = ({
  invoice,
  company = defaultCompanyProfile,
}: {
  invoice: Invoice;
  company?: CompanyProfile;
}) => {
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  );
  const discount = Number(invoice.discount || 0);
  const tax = Number(invoice.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logoBase64 ? <Image src={company.logoBase64} style={styles.logo} /> : null}
            <View>
            <Text style={styles.title}>INVOICE</Text>
              <Text style={styles.companyName}>{company.companyName || "CV ADITARA JAYA MAKMUR"}</Text>
              <Text style={styles.companyMeta}>{company.city || ""}</Text>
            </View>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.textBold}>{invoice.invoice_number}</Text>
            <Text>Date: {invoice.issue_date}</Text>
            {invoice.due_date && <Text>Due Date: {invoice.due_date}</Text>}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.clientBox}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.textBold}>{invoice.client.name}</Text>
            {invoice.client.company && <Text>{invoice.client.company}</Text>}
            {formatClientAddress(invoice.client) && <Text>{formatClientAddress(invoice.client)}</Text>}
            {invoice.client.email && <Text>{invoice.client.email}</Text>}
            {invoice.client.phone && <Text>{invoice.client.phone}</Text>}
          </View>
          <View style={styles.ourBox}>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={styles.textBold}>{company.companyName || "User"}</Text>
            {company.address ? <Text>{company.address}</Text> : null}
            {company.phone ? <Text>{company.phone}</Text> : null}
            {company.email ? <Text>{company.email}</Text> : null}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.tdBase, styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.tdBase, styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.tdBase, styles.th, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tdBase, styles.th, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tr}>
              <Text style={[styles.tdBase, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.tdBase, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tdBase, styles.colPrice]}>
                {formatCurrency(Number(item.unit_price), invoice.currency)}
              </Text>
              <Text style={[styles.tdBase, styles.colTotal]}>
                {formatCurrency(
                  Number(item.quantity) * Number(item.unit_price),
                  invoice.currency
                )}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(subtotal, invoice.currency)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text>Discount</Text>
              <Text>- {formatCurrency(discount, invoice.currency)}</Text>
            </View>
          )}
          {tax > 0 && (
            <View style={styles.summaryRow}>
              <Text>Tax</Text>
              <Text>{formatCurrency(tax, invoice.currency)}</Text>
            </View>
          )}
          <View style={styles.summaryRowTotal}>
            <Text>Total</Text>
            <Text>{formatCurrency(total, invoice.currency)}</Text>
          </View>
        </View>

        {/* Notes & Terms */}
        <View style={styles.notesBox}>
          {invoice.notes && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.notesTitle}>Notes:</Text>
              <Text>{invoice.notes}</Text>
            </View>
          )}
          {invoice.terms && (
            <View>
              <Text style={styles.notesTitle}>Terms:</Text>
              <Text>{invoice.terms}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {company.signatureBase64 ? (
            <View style={{ alignItems: "center", marginBottom: 6 }}>
              <Image src={company.signatureBase64} style={{ width: 90, height: 45, objectFit: "contain" }} />
            </View>
          ) : null}
          <Text style={{ textAlign: "center" }}>
            Thank you for your business.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
