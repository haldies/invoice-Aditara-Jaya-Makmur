import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { getUnit, formatQuantity } from "@/lib/pdfUtils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    color: "#000000",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  logoLeft: {
    width: 80,
    height: 45,
    marginRight: 10,
    objectFit: "contain",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontFamily: "Times-Bold",
    fontSize: 12.5,
    textTransform: "uppercase",
  },
  companySubtitle: {
    fontSize: 8.5,
    fontFamily: "Times-Bold",
    marginTop: 1,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    marginTop: 1,
  },
  infoLabel: {
    width: 40,
    fontSize: 8,
  },
  infoColon: {
    width: 8,
    fontSize: 8,
  },
  infoValue: {
    flex: 1,
    fontSize: 8,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 1.5,
    marginTop: 12,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  metaSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  metaLeft: {
    width: "45%",
  },
  metaRight: {
    width: "50%",
    backgroundColor: "#f9f9f9",
    borderWidth: 0.5,
    borderColor: "#d0d0d0",
    padding: 10,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    width: 75,
    fontFamily: "Times-Bold",
    fontSize: 9,
  },
  metaColon: {
    width: 10,
    fontSize: 9,
  },
  metaValue: {
    flex: 1,
    fontSize: 9,
  },
  recipientTitle: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    marginBottom: 4,
    color: "#555",
    textTransform: "uppercase",
  },
  recipientName: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    marginBottom: 2,
  },
  recipientDetail: {
    fontSize: 8.5,
    color: "#333",
    marginTop: 1,
  },
  table: {
    width: "100%",
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000000",
    paddingBottom: 5,
    marginBottom: 3,
  },
  tableHeaderCell: {
    fontFamily: "Times-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  colDesc: { flex: 1 },
  colQty: { width: 60, textAlign: "center" },
  colPrice: { width: 90, textAlign: "right" },
  colTotal: { width: 90, textAlign: "right" },
  
  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 25,
  },
  summaryBox: {
    width: 200,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#333",
  },
  summaryValue: {
    fontSize: 9,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 3,
    borderTopWidth: 1.5,
    borderTopColor: "#000000",
  },
  totalLabel: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
  },
  totalValue: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    textAlign: "right",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
  },
  signatureLeft: {
    flex: 1,
    fontSize: 8,
    color: "#666",
    fontStyle: "italic",
  },
  signatureBox: {
    width: 180,
    alignItems: "center",
  },
  signatureTitle: {
    fontSize: 9,
    marginBottom: 2,
  },
  signatureCompany: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    marginBottom: 40,
  },
  signatureImage: {
    width: 80,
    height: 38,
    objectFit: "contain",
    marginBottom: 2,
  },
  signatureLine: {
    width: 100,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
    marginBottom: 3,
  },
  signatureName: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    textDecoration: "underline",
    textTransform: "uppercase",
  },
});

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

interface Props {
  invoice: Invoice;
  company: CompanyProfile;
  includePpn: boolean;
}

export const POPDF = ({ invoice, company, includePpn }: Props) => {
  // Use BUY IN prices for PO instead of DEAL prices
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.buy_in_price || 0),
    0
  );
  const discount = Number(invoice.discount || 0);
  const tax = includePpn ? Math.round(subtotal * 0.11) : Number(invoice.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logoBase64 ? (
              <Image src={company.logoBase64} style={styles.logoLeft} />
            ) : null}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.companyName || "CV ADITARA JAYA MAKMUR"}</Text>
              <Text style={styles.companySubtitle}>Readymix, Building Material & General Supplier</Text>
              {company.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoColon}>:</Text>
                  <Text style={styles.infoValue}>{company.address}</Text>
                </View>
              )}
              {company.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Telp</Text>
                  <Text style={styles.infoColon}>:</Text>
                  <Text style={styles.infoValue}>{company.phone}</Text>
                </View>
              )}
              {company.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoColon}>:</Text>
                  <Text style={styles.infoValue}>{company.email}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ alignItems: "flex-end", alignSelf: "flex-end" }}>
            <Text style={{ fontSize: 8.5, fontFamily: "Times-Bold" }}>Authorized Dealer of Jayamix</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>PURCHASE ORDER</Text>

        {/* Metadata Section */}
        <View style={styles.metaSection}>
          <View style={styles.metaLeft}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>{invoice.issue_date}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>No.</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>
                {invoice.invoice_number.replace("INV", "PO")}
              </Text>
            </View>
            {invoice.due_date && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Delivery Date</Text>
                <Text style={styles.metaColon}>:</Text>
                <Text style={styles.metaValue}>{invoice.due_date}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Time</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>08.00 WIB</Text>
            </View>
          </View>

          <View style={styles.metaRight}>
            <Text style={styles.recipientTitle}>Kepada Yth. Deliver to :</Text>
            <Text style={styles.recipientName}>PT. KOKOH INTI AREBAMA Tbk.</Text>
            <Text style={styles.recipientDetail}>Distributor Utama Jayamix</Text>
            
            <View style={{ marginTop: 6, borderTopWidth: 0.5, borderTopColor: "#d0d0d0", paddingTop: 4 }}>
              <Text style={[styles.recipientTitle, { fontSize: 8 }]}>Kirim Ke (Client) :</Text>
              <Text style={{ fontSize: 9, fontFamily: "Times-Bold" }}>{invoice.client.company || invoice.client.name}</Text>
              <Text style={{ fontSize: 8.5, color: "#333", marginTop: 1 }}>{invoice.client.address}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Quantity</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total Price</Text>
          </View>
          {invoice.items.map((item, index) => {
            const unit = getUnit(item.description);
            const qtyFormatted = formatQuantity(Number(item.quantity));
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colQty}>
                  {unit ? `${qtyFormatted} ${unit}` : qtyFormatted}
                </Text>
                <Text style={styles.colPrice}>
                  {formatCurrency(Number(item.buy_in_price || 0), invoice.currency)}
                </Text>
                <Text style={styles.colTotal}>
                  {formatCurrency(
                    Number(item.quantity) * Number(item.buy_in_price || 0),
                    invoice.currency
                  )}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SUBTOTAL</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal, invoice.currency)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>POTONGAN</Text>
                <Text style={styles.summaryValue}>-{formatCurrency(discount, invoice.currency)}</Text>
              </View>
            )}
            {tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{includePpn ? "PPN 11%" : "PAJAK"}</Text>
                <Text style={styles.summaryValue}>{formatCurrency(tax, invoice.currency)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{formatCurrency(total, invoice.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLeft}>
            NB: Mohon konfirmasi kembali jadwal pengiriman. Terima kasih.
          </Text>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Approved by</Text>
            <Text style={styles.signatureCompany}>{company.companyName || "CV ADITARA JAYA MAKMUR"}</Text>
            {company.signatureBase64 ? (
              <Image src={company.signatureBase64} style={styles.signatureImage} />
            ) : (
              <View style={{ height: 38 }} />
            )}
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>
              {company.bankAccountHolder || "FAVIRRU BAGUS MAHARDHIKA"}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
