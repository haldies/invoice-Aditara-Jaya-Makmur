import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { getUnit, formatQuantity } from "@/lib/pdfUtils";

const BRAND_COLOR = "#1e6b4d"; // Deep green - professional branded
const BRAND_LIGHT = "#e8f5ef";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  topBar: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 48,
    paddingVertical: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  logoArea: { flex: 1 },
  logo: { width: 90, height: 45, objectFit: "contain" },
  companyNameWhite: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  companyTagline: { fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  invoiceTitleWhite: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: -0.5 },
  invoiceNumWhite: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  accentStrip: { backgroundColor: BRAND_LIGHT, paddingHorizontal: 48, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between" },
  accentItem: { alignItems: "center" },
  accentLabel: { fontSize: 8, color: BRAND_COLOR, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 },
  accentValue: { fontSize: 10, color: "#111", fontFamily: "Helvetica-Bold" },
  body: { paddingHorizontal: 48, paddingTop: 24, paddingBottom: 80 },
  billSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  billBox: { flex: 1 },
  billLabel: { fontSize: 9, color: BRAND_COLOR, fontFamily: "Helvetica-Bold", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  billName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#111" },
  billDetail: { fontSize: 9, color: "#555", marginTop: 2 },
  table: { width: "100%", marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 0,
  },
  tableHeaderCell: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#ffffff" },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableRowAlt: { backgroundColor: BRAND_LIGHT },
  colDesc: { flex: 1 },
  colQty: { width: 45, textAlign: "center" },
  colPrice: { width: 85, textAlign: "right" },
  colTotal: { width: 85, textAlign: "right" },
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
  totalRowBranded: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#ffffff" },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#ffffff" },
  notesSection: { marginBottom: 24 },
  notesLabel: { fontSize: 9, color: BRAND_COLOR, fontFamily: "Helvetica-Bold", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  notesText: { fontSize: 9, color: "#555", lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 48,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 9, color: "rgba(255,255,255,0.7)" },
  signatureBox: { alignItems: "center" },
  signatureImage: { width: 80, height: 36, objectFit: "contain", marginBottom: 4 },
  signatureLine: { width: 80, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.5)", marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: "rgba(255,255,255,0.8)", textAlign: "center" },
});

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);

const formatIndonesianDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length !== 3) return dateStr.split("T")[0];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  } catch (e) {
    return dateStr.split("T")[0];
  }
};

interface Props { invoice: Invoice; company: CompanyProfile; includePpn: boolean; }

export const TemplateBranded = ({ invoice, company, includePpn }: Props) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
  const discount = Number(invoice.discount || 0);
  const tax = includePpn ? Math.round(subtotal * 0.11) : Number(invoice.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.logoArea}>
            {company.logoBase64
              ? <Image src={company.logoBase64} style={styles.logo} />
              : <Text style={styles.companyNameWhite}>{company.companyName || "Perusahaan Anda"}</Text>}
            {company.address && <Text style={styles.companyTagline}>{company.address}{company.city ? `, ${company.city}` : ""}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitleWhite}>INVOICE</Text>
            <Text style={styles.invoiceNumWhite}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Accent Strip */}
        <View style={styles.accentStrip}>
          <View style={styles.accentItem}>
            <Text style={styles.accentLabel}>Tanggal Terbit</Text>
              <Text style={styles.accentValue}>{formatIndonesianDate(invoice.issue_date)}</Text>
          </View>
          {invoice.due_date && (
            <View style={styles.accentItem}>
              <Text style={styles.accentLabel}>Jatuh Tempo</Text>
              <Text style={styles.accentValue}>{formatIndonesianDate(invoice.due_date)}</Text>
            </View>
          )}
          {invoice.status && (
            <View style={styles.accentItem}>
              <Text style={styles.accentLabel}>Status</Text>
              <Text style={styles.accentValue}>{invoice.status.toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Bill To */}
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
                <Text style={styles.billLabel}>Info Pembayaran</Text>
                {company.bankName && <Text style={styles.billDetail}>{company.bankName}</Text>}
                {company.bankAccount && <Text style={[styles.billDetail, { fontFamily: "Helvetica-Bold", color: "#111" }]}>{company.bankAccount}</Text>}
                {company.bankAccountHolder && <Text style={styles.billDetail}>a.n {company.bankAccountHolder}</Text>}
                {company.npwp && <Text style={[styles.billDetail, { marginTop: 6 }]}>NPWP: {company.npwp}</Text>}
              </View>
            )}
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>Deskripsi</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>Harga Satuan</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            </View>
            {invoice.items.map((item, i) => {
              const unit = getUnit(item.description);
              const qtyFormatted = formatQuantity(Number(item.quantity));
              return (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
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
              <View style={styles.totalRowBranded}>
                <Text style={styles.totalLabel}>TOTAL</Text>
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
                <Text style={[styles.notesLabel, { marginTop: 8 }]}>Syarat Pembayaran</Text>
                <Text style={styles.notesText}>{invoice.terms}</Text>
              </>}
            </View>
          )}

          {/* Signature */}
          <View style={{ alignItems: "flex-end", marginTop: 16 }}>
            <View style={{ alignItems: "center", width: 130 }}>
              {company.signatureBase64
                ? <Image src={company.signatureBase64} style={styles.signatureImage} />
                : <View style={{ height: 44 }} />}
              <View style={{ width: 120, borderBottomWidth: 1, borderBottomColor: "#333", marginBottom: 4 }} />
              <Text style={{ fontSize: 9, color: "#555", textAlign: "center" }}>{company.companyName || "Hormat Kami"}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Terima kasih atas kepercayaan Anda.</Text>
          {company.email && <Text style={styles.footerText}>{company.email}</Text>}
          {company.phone && <Text style={styles.footerText}>{company.phone}</Text>}
        </View>
      </Page>
    </Document>
  );
};
