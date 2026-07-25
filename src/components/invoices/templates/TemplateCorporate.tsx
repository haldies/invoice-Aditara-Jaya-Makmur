import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { getUnit, formatQuantity } from "@/lib/pdfUtils";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginBottom: 0,
  },
  headerLeft: {
    backgroundColor: "#1a1a2e",
    width: "55%",
    padding: 32,
    justifyContent: "flex-end",
  },
  headerRight: {
    backgroundColor: "#f8f8f8",
    flex: 1,
    padding: 32,
    borderLeftWidth: 4,
    borderLeftColor: "#c8a96e",
    alignItems: "flex-end",
  },
  logo: { width: 90, height: 45, objectFit: "contain", marginBottom: 12 },
  companyNameWhite: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  companyDetailWhite: { fontSize: 9, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  invoiceTitleGold: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#c8a96e", letterSpacing: 2 },
  invoiceNumber: { fontSize: 10, color: "#555", marginTop: 4 },
  dateLabel: { fontSize: 8, color: "#888", marginTop: 8, letterSpacing: 1 },
  dateValue: { fontSize: 10, color: "#111", fontFamily: "Helvetica-Bold" },
  accentLine: { height: 3, backgroundColor: "#c8a96e", marginBottom: 24 },
  body: { paddingHorizontal: 36, paddingTop: 24, paddingBottom: 80 },
  billSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  billBox: { flex: 1 },
  billLabel: { fontSize: 9, color: "#c8a96e", fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" },
  billName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#111" },
  billDetail: { fontSize: 9, color: "#555", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginBottom: 16 },
  table: { width: "100%", marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a2e",
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderCell: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#1a1a2e", letterSpacing: 0.5, textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  colDesc: { flex: 1 },
  colQty: { width: 45, textAlign: "center" },
  colPrice: { width: 85, textAlign: "right" },
  colTotal: { width: 85, textAlign: "right", fontFamily: "Helvetica-Bold" },
  summarySection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 24 },
  summaryBox: { width: 230 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  summaryLabel: { color: "#555", fontSize: 10 },
  summaryValue: { color: "#111", fontSize: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#c8a96e" },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#c8a96e" },
  notesSection: { marginBottom: 24 },
  notesLabel: { fontSize: 9, color: "#1a1a2e", fontFamily: "Helvetica-Bold", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  notesText: { fontSize: 9, color: "#555", lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#c8a96e",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  footerText: { fontSize: 9, color: "#888" },
  signatureImage: { width: 80, height: 36, objectFit: "contain", marginBottom: 4 },
  signatureLine: { width: 100, borderBottomWidth: 1, borderBottomColor: "#1a1a2e", marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: "#555", textAlign: "center" },
});

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);

interface Props { invoice: Invoice; company: CompanyProfile; includePpn: boolean; }

export const TemplateCorporate = ({ invoice, company, includePpn }: Props) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
  const discount = Number(invoice.discount || 0);
  const tax = includePpn ? Math.round(subtotal * 0.11) : Number(invoice.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logoBase64
              ? <Image src={company.logoBase64} style={styles.logo} />
              : null}
            <Text style={styles.companyNameWhite}>{company.companyName || "Perusahaan Anda"}</Text>
            {company.address && <Text style={styles.companyDetailWhite}>{company.address}</Text>}
            {company.city && <Text style={styles.companyDetailWhite}>{company.city}</Text>}
            {company.phone && <Text style={styles.companyDetailWhite}>Tel: {company.phone}</Text>}
            {company.npwp && <Text style={styles.companyDetailWhite}>NPWP: {company.npwp}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitleGold}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.dateLabel}>TANGGAL</Text>
            <Text style={styles.dateValue}>{invoice.issue_date}</Text>
            {invoice.due_date && <>
              <Text style={styles.dateLabel}>JATUH TEMPO</Text>
              <Text style={styles.dateValue}>{invoice.due_date}</Text>
            </>}
          </View>
        </View>

        <View style={styles.accentLine} />

        <View style={styles.body}>
          {/* Bill Section */}
          <View style={styles.billSection}>
            <View style={styles.billBox}>
              <Text style={styles.billLabel}>Kepada Yth.</Text>
              <Text style={styles.billName}>{invoice.client.name}</Text>
              {invoice.client.company && <Text style={styles.billDetail}>{invoice.client.company}</Text>}
              {invoice.client.address && <Text style={styles.billDetail}>{invoice.client.address}</Text>}
              {invoice.client.email && <Text style={styles.billDetail}>{invoice.client.email}</Text>}
              {invoice.client.phone && <Text style={styles.billDetail}>Tel: {invoice.client.phone}</Text>}
            </View>
            {(company.bankName || company.bankAccount) && (
              <View style={[styles.billBox, { alignItems: "flex-end" }]}>
                <Text style={styles.billLabel}>Informasi Bank</Text>
                {company.bankName && <Text style={styles.billDetail}>{company.bankName}</Text>}
                {company.bankAccount && <Text style={[styles.billDetail, { fontFamily: "Helvetica-Bold", color: "#111", fontSize: 11 }]}>{company.bankAccount}</Text>}
                {company.bankAccountHolder && <Text style={styles.billDetail}>a.n {company.bankAccountHolder}</Text>}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>Keterangan</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>Harga Satuan</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Jumlah</Text>
            </View>
            {invoice.items.map((item, i) => {
              const unit = getUnit(item.description);
              const qtyFormatted = formatQuantity(Number(item.quantity));
              return (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.colDesc}>{item.description}</Text>
                  <Text style={styles.colQty}>
                    {unit ? `${qtyFormatted} ${unit}` : qtyFormatted}
                  </Text>
                  <Text style={styles.colPrice}>{formatCurrency(Number(item.unit_price), invoice.currency)}</Text>
                  <Text style={styles.colTotal}>{formatCurrency(Number(item.quantity) * Number(item.unit_price), invoice.currency)}</Text>
                </View>
              );
            })}
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(subtotal, invoice.currency)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Diskon</Text>
                  <Text style={styles.summaryValue}>- {formatCurrency(discount, invoice.currency)}</Text>
                </View>
              )}
              {tax > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{includePpn ? "PPN 11%" : "Pajak"}</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(tax, invoice.currency)}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL TAGIHAN</Text>
                <Text style={styles.totalValue}>{formatCurrency(total, invoice.currency)}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {(invoice.notes || invoice.terms) && (
            <View style={styles.notesSection}>
              {invoice.notes && <>
                <Text style={styles.notesLabel}>Catatan</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </>}
              {invoice.terms && <>
                <Text style={[styles.notesLabel, { marginTop: 8 }]}>Syarat & Ketentuan</Text>
                <Text style={styles.notesText}>{invoice.terms}</Text>
              </>}
            </View>
          )}

          {/* Signature */}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
            <View style={{ alignItems: "center", width: 140 }}>
              {company.signatureBase64
                ? <Image src={company.signatureBase64} style={styles.signatureImage} />
                : <View style={{ height: 44 }} />}
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>{company.companyName || "Hormat Kami"}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Terima kasih atas kepercayaan Anda.</Text>
          <View style={{ alignItems: "flex-end" }}>
            {company.email && <Text style={styles.footerText}>{company.email}</Text>}
            {company.phone && <Text style={styles.footerText}>{company.phone}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
};
