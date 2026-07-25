import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { getUnit, formatQuantity } from "@/lib/pdfUtils";

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    lineHeight: 1.5,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  headerLeft: { flex: 1 },
  logo: { width: 80, height: 36, objectFit: "contain", marginBottom: 6 },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111",
  },
  companyDetail: {
    fontSize: 8.5,
    color: "#888",
    marginTop: 2,
  },
  headerRight: { alignItems: "flex-end" },
  invoiceWord: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#111",
  },
  invoiceNumber: {
    fontSize: 9,
    color: "#888",
    marginTop: 4,
  },
  dateRow: { flexDirection: "row", marginTop: 3, gap: 6 },
  dateLabel: { fontSize: 8.5, color: "#aaa" },
  dateValue: { fontSize: 8.5, color: "#555", fontFamily: "Helvetica-Bold" },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
    marginBottom: 24,
  },
  thickDivider: {
    borderBottomWidth: 2,
    borderBottomColor: "#111",
    marginBottom: 24,
  },

  // Billing
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  billingBlock: { flex: 1 },
  billingLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#aaa",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  billingName: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#111",
  },
  billingDetail: {
    fontSize: 8.5,
    color: "#666",
    marginTop: 2,
  },
  paymentBlock: { flex: 1, alignItems: "flex-end" },
  bankName: { fontSize: 8.5, color: "#888", marginTop: 2 },
  bankNumber: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111",
    marginTop: 3,
  },
  bankHolder: { fontSize: 8.5, color: "#888", marginTop: 2 },

  // Table
  table: { marginBottom: 24 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#111",
    paddingBottom: 6,
    marginBottom: 0,
  },
  th: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 8,
  },
  td: { fontSize: 9, color: "#222" },

  colNo:    { width: 20 },
  colDesc:  { flex: 1, paddingRight: 8 },
  colQty:   { width: 72, textAlign: "right" },
  colPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },

  // Summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryLeft: { fontSize: 8.5, color: "#888" },
  summaryRight: { fontSize: 8.5, color: "#333" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: "#111",
    paddingTop: 8,
    marginTop: 4,
  },
  totalLeft: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111" },
  totalRight: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111" },

  // Notes
  notesLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#aaa",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
    marginTop: 20,
  },
  notesText: { fontSize: 8.5, color: "#666", lineHeight: 1.5 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 56,
    right: 56,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerText: { fontSize: 8, color: "#bbb" },
  signatureBox: { alignItems: "center" },
  signatureImg: { width: 70, height: 32, objectFit: "contain", marginBottom: 4 },
  signatureLine: { width: 80, borderBottomWidth: 1, borderBottomColor: "#ccc", marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: "#888" },
});

const fmt = (n: number, cur: string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: cur, minimumFractionDigits: 0 }).format(n);

interface Props { invoice: Invoice; company: CompanyProfile; includePpn: boolean; }

export const TemplateModern = ({ invoice, company, includePpn }: Props) => {
  const subtotal = invoice.items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
  const discount = Number(invoice.discount || 0);
  const tax      = includePpn ? Math.round(subtotal * 0.11) : Number(invoice.tax || 0);
  const total    = Math.max(0, subtotal - discount + tax);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logoBase64
              ? <Image src={company.logoBase64} style={styles.logo} />
              : <Text style={styles.companyName}>{company.companyName || "Perusahaan"}</Text>}
            {company.companyName && company.logoBase64 &&
              <Text style={styles.companyName}>{company.companyName}</Text>}
            {company.address &&
              <Text style={styles.companyDetail}>{company.address}{company.city ? `, ${company.city}` : ""}</Text>}
            {company.phone && <Text style={styles.companyDetail}>{company.phone}</Text>}
            {company.email && <Text style={styles.companyDetail}>{company.email}</Text>}
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.invoiceWord}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <View style={[styles.dateRow, { marginTop: 8 }]}>
              <Text style={styles.dateLabel}>Tanggal</Text>
              <Text style={styles.dateValue}>{invoice.issue_date}</Text>
            </View>
            {invoice.due_date && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Jatuh Tempo</Text>
                <Text style={styles.dateValue}>{invoice.due_date}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.thickDivider} />

        {/* ── Bill To + Payment ── */}
        <View style={styles.billingRow}>
          <View style={styles.billingBlock}>
            <Text style={styles.billingLabel}>Kepada</Text>
            <Text style={styles.billingName}>{invoice.client.name}</Text>
            {invoice.client.company &&
              <Text style={styles.billingDetail}>{invoice.client.company}</Text>}
            {invoice.client.address &&
              <Text style={styles.billingDetail}>{invoice.client.address}</Text>}
            {invoice.client.phone &&
              <Text style={styles.billingDetail}>{invoice.client.phone}</Text>}
            {invoice.client.email &&
              <Text style={styles.billingDetail}>{invoice.client.email}</Text>}
          </View>

          {(company.bankName || company.bankAccount) && (
            <View style={styles.paymentBlock}>
              <Text style={styles.billingLabel}>Pembayaran ke</Text>
              {company.bankName && <Text style={styles.bankName}>{company.bankName}</Text>}
              {company.bankAccount && <Text style={styles.bankNumber}>{company.bankAccount}</Text>}
              {company.bankAccountHolder &&
                <Text style={styles.bankHolder}>a.n {company.bankAccountHolder}</Text>}
            </View>
          )}
        </View>

        {/* ── Table ── */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colNo]}>#</Text>
            <Text style={[styles.th, styles.colDesc]}>Deskripsi</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colPrice]}>Harga</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>

          {invoice.items.map((item, i) => {
            const unit = getUnit(item.description);
            const qty  = formatQuantity(Number(item.quantity));
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, styles.colNo]}>{i + 1}</Text>
                <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.td, styles.colQty]}>{unit ? `${qty} ${unit}` : qty}</Text>
                <Text style={[styles.td, styles.colPrice]}>{fmt(Number(item.unit_price), invoice.currency)}</Text>
                <Text style={[styles.td, styles.colTotal]}>{fmt(Number(item.quantity) * Number(item.unit_price), invoice.currency)}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Summary ── */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 30 }}>
          <View style={{ width: 220 }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLeft}>Subtotal</Text>
              <Text style={styles.summaryRight}>{fmt(subtotal, invoice.currency)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLeft}>Diskon</Text>
                <Text style={styles.summaryRight}>- {fmt(discount, invoice.currency)}</Text>
              </View>
            )}
            {tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLeft}>{includePpn ? "PPN 11%" : "Pajak"}</Text>
                <Text style={styles.summaryRight}>{fmt(tax, invoice.currency)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLeft}>Total</Text>
              <Text style={styles.totalRight}>{fmt(total, invoice.currency)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes & Terms ── */}
        {invoice.notes && (
          <>
            <Text style={styles.notesLabel}>Catatan</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </>
        )}
        {invoice.terms && (
          <>
            <Text style={[styles.notesLabel, { marginTop: invoice.notes ? 12 : 20 }]}>Syarat Pembayaran</Text>
            <Text style={styles.notesText}>{invoice.terms}</Text>
          </>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {company.email || "Terima kasih atas kepercayaan Anda."}
          </Text>
          <View style={styles.signatureBox}>
            {company.signatureBase64
              ? <Image src={company.signatureBase64} style={styles.signatureImg} />
              : <View style={styles.signatureLine} />}
            <Text style={styles.signatureLabel}>{company.companyName || "Hormat Kami"}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
