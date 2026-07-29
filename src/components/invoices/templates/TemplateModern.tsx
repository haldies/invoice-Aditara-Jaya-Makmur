import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { getUnit, formatQuantity, formatClientAddress, generatePdfDocumentNumber } from "@/lib/pdfUtils";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000",
    backgroundColor: "#fff",
  },
  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: "contain",
    marginRight: 10,
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  companySub: {
    fontSize: 8,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 7,
    flexDirection: "row",
    marginBottom: 1,
  },
  companyDetailLabel: { width: 35 },
  headerRight: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 120,
  },
  logoRight: { width: 80, height: 40, objectFit: "contain" },
  // Title
  titleText: {
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 20,
  },
  // Info Block
  infoBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  infoLeft: {
    width: "50%",
  },
  infoRight: {
    width: "40%",
  },
  infoHeading: {
    textDecoration: "underline",
    marginBottom: 4,
    fontSize: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  infoLabel: {
    width: 50,
  },
  infoColon: {
    width: 10,
  },
  infoValue: {
    flex: 1,
  },
  // Table
  table: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
  },
  tr: {
    flexDirection: "row",
  },
  tdBase: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    paddingVertical: 5,
    paddingHorizontal: 4,
    justifyContent: "center",
    minHeight: 22,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  colNo: { width: "5%", textAlign: "center" },
  colDesc: { width: "45%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "17.5%" },
  colTotal: { width: "17.5%" },
  currencyCell: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  currencyRp: {
    marginRight: 2,
  },
  currencyVal: {
    textAlign: "right",
    flex: 1,
  },
  // Summary
  summaryLabelCell: {
    width: "17.5%",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
    padding: 4,
  },
  summaryValueCell: {
    width: "17.5%",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 4,
  },
  // Footer
  footerBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  footerLeft: {
    width: "65%",
  },
  footerListRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  footerListNum: { width: 12 },
  footerListLabel: { width: 60 },
  footerListColon: { width: 10 },
  footerListVal: { flex: 1 },
  footerRight: {
    width: "35%",
    alignItems: "center",
  },
  signatureName: {
    textDecoration: "underline",
    fontFamily: "Helvetica-Bold",
  },
  signatureImg: {
    width: 100,
    height: 60,
    objectFit: "contain",
    marginVertical: 5,
  }
});

const fmtAmt = (n: number) => {
  if (!n) return "0,00";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

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

const fmtQty = (n: number) => {
  if (!n) return "";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

interface Props { invoice: Invoice; company: CompanyProfile; includePpn: boolean; }

export const TemplateModern = ({ invoice, company, includePpn }: Props) => {
  const subtotal = invoice.items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
  const discount = Number(invoice.discount || 0);
  const tax = includePpn ? Math.round(subtotal * 0.11) : Number(invoice.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);

  // Pad items to 10 rows
  const rows = [...invoice.items];
  while (rows.length < 10) {
    rows.push({ description: "", quantity: 0, unit_price: 0, id: "" } as any);
  }

  const bankText = [company.bankName, company.bankAccount].filter(Boolean).join(" ") || "-";
  const bankHolder = company.bankAccountHolder ? ` a.n. ${company.bankAccountHolder}` : "";
  const paymentText = bankText !== "-" ? `Cash/Giro/Transfer ke Rek. ${bankText}${bankHolder}` : "-";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {company.logoBase64 && <Image src={company.logoBase64} style={styles.logo} />}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.companyName || "CV ADITARA JAYA MAKMUR"}</Text>
              <Text style={styles.companySub}>Readymix, Building Material & General Supplier</Text>
              <View style={styles.companyDetail}>
                <Text style={styles.companyDetailLabel}>Address</Text>
                <Text>: {company.address || "-"}</Text>
              </View>
              <View style={styles.companyDetail}>
                <Text style={styles.companyDetailLabel}>Telp</Text>
                <Text>: {company.phone || "-"}</Text>
              </View>
              <View style={styles.companyDetail}>
                <Text style={styles.companyDetailLabel}>Email</Text>
                <Text>: {company.email || "-"}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            {company.logoRightBase64 ? <Image src={company.logoRightBase64} style={styles.logoRight} /> : null}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.titleText}>INVOICE</Text>

        {/* Info Block */}
        <View style={styles.infoBlock}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoHeading}>CUSTOMER :</Text>
            <Text>{invoice.client.name}</Text>
            {formatClientAddress(invoice.client) && <Text>{formatClientAddress(invoice.client)}</Text>}
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.infoHeading}>DETAIL :</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{formatIndonesianDate(invoice.issue_date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{generatePdfDocumentNumber("invoice", invoice)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivery</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{invoice.due_date ? formatIndonesianDate(invoice.due_date) : "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>
                {invoice.due_date && invoice.due_date.includes("T") 
                  ? invoice.due_date.split("T")[1].substring(0, 5) 
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tr}>
            <View style={[styles.tdBase, styles.th, styles.colNo]}><Text>No.</Text></View>
            <View style={[styles.tdBase, styles.th, styles.colDesc]}><Text>Description</Text></View>
            <View style={[styles.tdBase, styles.th, styles.colQty]}><Text>Quantity</Text></View>
            <View style={[styles.tdBase, styles.th, styles.colPrice]}><Text>Unit Price</Text></View>
            <View style={[styles.tdBase, styles.th, styles.colTotal]}><Text>Total Amount</Text></View>
          </View>

          {/* Rows */}
          {rows.map((item, i) => {
            const hasData = !!item.description;
            const unit = getUnit(item.description);
            const qtyStr = item.quantity ? `${fmtQty(Number(item.quantity))} ${unit || ""}`.trim() : "";
            const priceStr = item.unit_price ? fmtAmt(Number(item.unit_price)) : "";
            const totalStr = (item.quantity && item.unit_price) ? fmtAmt(Number(item.quantity) * Number(item.unit_price)) : "";

            return (
              <View key={i} style={styles.tr}>
                <View style={[styles.tdBase, styles.colNo]}><Text>{hasData ? i + 1 : "\u00A0"}</Text></View>
                <View style={[styles.tdBase, styles.colDesc]}><Text>{item.description || "\u00A0"}</Text></View>
                <View style={[styles.tdBase, styles.colQty]}><Text>{qtyStr || "\u00A0"}</Text></View>
                <View style={[styles.tdBase, styles.colPrice]}>
                  {hasData && item.unit_price ? (
                    <View style={styles.currencyCell}>
                      <Text style={styles.currencyRp}>Rp</Text>
                      <Text style={styles.currencyVal}>{priceStr}</Text>
                    </View>
                  ) : <Text>{"\u00A0"}</Text>}
                </View>
                <View style={[styles.tdBase, styles.colTotal]}>
                  {hasData && (item.quantity || item.unit_price) ? (
                    <View style={styles.currencyCell}>
                      <Text style={styles.currencyRp}>Rp</Text>
                      <Text style={styles.currencyVal}>{totalStr}</Text>
                    </View>
                  ) : <Text>{"\u00A0"}</Text>}
                </View>
              </View>
            );
          })}

        </View>

        {/* Summary */}
        <View style={{ flexDirection: "column", alignItems: "flex-end", width: "100%" }}>
          <View style={{ flexDirection: "row", width: "35%" }}>
            <View style={[styles.summaryLabelCell, { width: "50%" }]}><Text>SUBTOTAL</Text></View>
            <View style={[styles.summaryValueCell, { width: "50%" }]}>
              <View style={styles.currencyCell}>
                <Text style={styles.currencyRp}>Rp</Text>
                <Text style={styles.currencyVal}>{fmtAmt(subtotal)}</Text>
              </View>
            </View>
          </View>
          
          <View style={{ flexDirection: "row", width: "35%" }}>
            <View style={[styles.summaryLabelCell, { width: "50%" }]}><Text>{includePpn ? "PPN 11%" : "PAJAK"}</Text></View>
            <View style={[styles.summaryValueCell, { width: "50%" }]}>
              <View style={styles.currencyCell}>
                <Text style={styles.currencyRp}>Rp</Text>
                <Text style={styles.currencyVal}>{fmtAmt(tax)}</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", width: "35%" }}>
            <View style={[styles.summaryLabelCell, { width: "50%" }]}><Text>TOTAL</Text></View>
            <View style={[styles.summaryValueCell, { width: "50%" }]}>
              <View style={styles.currencyCell}>
                <Text style={styles.currencyRp}>Rp</Text>
                <Text style={styles.currencyVal}>{fmtAmt(total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer / Notes */}
        <View style={styles.footerBlock}>
          <View style={styles.footerLeft}>
            {[
              { label: "Pembayaran", val: paymentText },
              { label: "Mohon", val: "Konfirmasi" },
              ...(invoice.notes ? [{ label: "Keterangan", val: invoice.notes }] : []),
            ].map((item, idx) => (
              <View key={idx} style={styles.footerListRow}>
                <Text style={styles.footerListNum}>{idx + 1}.</Text>
                <Text style={styles.footerListLabel}>{item.label}</Text>
                <Text style={styles.footerListColon}>:</Text>
                <Text style={styles.footerListVal}>{item.val}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.footerRight}>
            <Text>Hormat Kami,</Text>
            <Text>{company.companyName || "CV ADITARA JAYA MAKMUR"}</Text>
            <View style={{ height: 30 }} />
            {company.signatureBase64 ? (
              <Image src={company.signatureBase64} style={styles.signatureImg} />
            ) : (
              <View style={{ height: 60 }} />
            )}
            <Text style={styles.signatureName}>{(invoice.user as any)?.name || "FAVIRRU BAGUS MAHARDHIKA"}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
