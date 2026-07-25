import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { getUnit, formatQuantity } from "@/lib/pdfUtils";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    color: "#000000",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  logoLeft: {
    width: 90,
    height: 50,
    marginRight: 10,
    objectFit: "contain",
  },
  logoRight: {
    width: 90,
    height: 45,
    objectFit: "contain",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    color: "#000000",
    textTransform: "uppercase",
  },
  companySubtitle: {
    fontSize: 8.5,
    fontFamily: "Times-Bold",
    color: "#000000",
    marginTop: 1,
    marginBottom: 3,
  },
  infoRow: {
    flexDirection: "row",
    marginTop: 1,
  },
  infoLabel: {
    width: 40,
    fontSize: 8.5,
  },
  infoColon: {
    width: 8,
    fontSize: 8.5,
  },
  infoValue: {
    flex: 1,
    fontSize: 8.5,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 20,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#b0b0b0",
    paddingVertical: 5,
    minHeight: 20,
    alignItems: "flex-start",
  },
  label: {
    width: 145,
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    textTransform: "uppercase",
  },
  colon: {
    width: 15,
    fontSize: 9.5,
  },
  value: {
    flex: 1,
    fontSize: 9.5,
  },
  // Sub-rows nested under UNTUK PEMBAYARAN
  subRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#b0b0b0",
    paddingVertical: 4.5,
    minHeight: 18,
    alignItems: "center",
  },
  subSpacer: {
    width: 160, // 145 + 15
  },
  subLabel: {
    width: 90,
    fontFamily: "Times-Bold",
    fontSize: 9.5,
  },
  subColon: {
    width: 15,
    fontSize: 9.5,
  },
  subValueContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subValueLeft: {
    fontSize: 9.5,
  },
  subValueRight: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 140,
  },
  subValueRightEqual: {
    width: 30,
    fontSize: 9.5,
  },
  subValueRightAmount: {
    flex: 1,
    textAlign: "right",
    fontSize: 9.5,
  },
  // Total Row
  totalRow: {
    flexDirection: "row",
    paddingVertical: 6,
    marginTop: 8,
    alignItems: "center",
  },
  totalSpacer: {
    width: 160,
  },
  totalLabel: {
    width: 90,
    fontFamily: "Times-Bold",
    fontSize: 12,
    letterSpacing: 2,
  },
  totalEmptyColon: {
    width: 15,
  },
  totalValueContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    width: 140,
    paddingVertical: 2,
  },
  totalEqualSign: {
    width: 30,
    fontFamily: "Times-Bold",
    fontSize: 11.5,
  },
  totalAmountText: {
    flex: 1,
    textAlign: "right",
    fontFamily: "Times-Bold",
    fontSize: 11.5,
  },
  doubleLineContainer: {
    width: 140,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    height: 3,
    marginTop: 2,
    alignSelf: "flex-end",
  },
  // Signature Block
  signatureBlockSection: {
    marginTop: 35,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBox: {
    width: 250,
    alignItems: "center",
  },
  signatureDate: {
    fontSize: 9.5,
    marginBottom: 4,
  },
  signatureRole: {
    fontSize: 9.5,
    marginBottom: 2,
  },
  signatureCompany: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    marginBottom: 40, // Space for signing
  },
  signatureImage: {
    width: 90,
    height: 38,
    objectFit: "contain",
    marginBottom: 2,
  },
  signatureName: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    textDecoration: "underline",
    textTransform: "uppercase",
  },
});

const formatCurrency = (amount: number, currency: string) => {
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return formatted;
};

function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      // YYYY-MM-DD
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${months[monthIdx]} ${year}`;
    }
  } catch (e) {}
  return dateStr;
}

interface Props {
  invoice: Invoice;
  company: CompanyProfile;
  includePpn: boolean;
}

export const ReceiptPDF = ({ invoice, company, includePpn }: Props) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
  const discount = Number(invoice.discount || 0);
  const tax = includePpn ? Math.round(subtotal * 0.11) : Number(invoice.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);

  // Default to today if issue date is empty
  const formattedDate = formatDateIndo(invoice.paid_date || invoice.issue_date || new Date().toISOString().slice(0, 10));
  const locationAndDate = company.city 
    ? `${company.city.split(",")[0]}, ${formattedDate}` 
    : formattedDate;

  // Primary concrete item details
  const primaryItem = invoice.items[0];

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
              
              {company.address ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoColon}>:</Text>
                  <Text style={styles.infoValue}>{company.address}</Text>
                </View>
              ) : null}
              {company.phone ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Telp</Text>
                  <Text style={styles.infoColon}>:</Text>
                  <Text style={styles.infoValue}>{company.phone}</Text>
                </View>
              ) : null}
              {company.email ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoColon}>:</Text>
                  <Text style={styles.infoValue}>{company.email}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {company.logoRightBase64 ? (
            <Image src={company.logoRightBase64} style={styles.logoRight} />
          ) : null}
        </View>

        {/* Title */}
        <Text style={styles.title}>KWITANSI</Text>

        {/* TELAH TERIMA DARI */}
        <View style={styles.row}>
          <Text style={styles.label}>TELAH TERIMA DARI</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={[styles.value, { fontFamily: "Times-Bold" }]}>
            {invoice.client.company || invoice.client.name}
          </Text>
        </View>

        {/* ALAMAT */}
        <View style={styles.row}>
          <Text style={styles.label}>ALAMAT</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{invoice.client.address || "-"}</Text>
        </View>

        {/* PROYEK */}
        <View style={styles.row}>
          <Text style={styles.label}>PROYEK</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{invoice.notes || "-"}</Text>
        </View>

        {/* UNTUK PEMBAYARAN */}
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.label}>UNTUK PEMBAYARAN</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>
            {primaryItem ? primaryItem.description : "-"}
          </Text>
        </View>

        {/* Nested Volume & pricing rows */}
        {invoice.items.map((item, index) => {
          const unit = getUnit(item.description);
          const qtyFormatted = formatQuantity(Number(item.quantity));
          const qtyDisplay = unit ? `${qtyFormatted} ${unit}` : qtyFormatted;
          return (
            <View key={index} style={styles.subRow}>
              <View style={styles.subSpacer} />
              <Text style={styles.subLabel}>{index === 0 ? "Volume" : `Volume ${index + 1}`}</Text>
              <Text style={styles.subColon}>:</Text>
              <View style={styles.subValueContainer}>
                <Text style={styles.subValueLeft}>
                  {qtyDisplay} @ Rp {item.unit_price.toLocaleString("id-ID")}
                </Text>
                <View style={styles.subValueRight}>
                  <Text style={styles.subValueRightEqual}>= Rp.</Text>
                  <Text style={styles.subValueRightAmount}>
                    {formatCurrency(Number(item.quantity) * Number(item.unit_price), invoice.currency)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* PPN / Tax Row */}
        {tax > 0 ? (
          <View style={styles.subRow}>
            <View style={styles.subSpacer} />
            <Text style={styles.subLabel}>Lain-Lain</Text>
            <Text style={styles.subColon}>:</Text>
            <View style={styles.subValueContainer}>
              <Text style={styles.subValueLeft}>{includePpn ? "PPN 11%" : "Pajak"}</Text>
              <View style={styles.subValueRight}>
                <Text style={styles.subValueRightEqual}>= Rp.</Text>
                <Text style={styles.subValueRightAmount}>
                  {formatCurrency(tax, invoice.currency)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Discount Row */}
        {discount > 0 ? (
          <View style={styles.subRow}>
            <View style={styles.subSpacer} />
            <Text style={styles.subLabel}>Potongan</Text>
            <Text style={styles.subColon}>:</Text>
            <View style={styles.subValueContainer}>
              <Text style={styles.subValueLeft}>Diskon</Text>
              <View style={styles.subValueRight}>
                <Text style={styles.subValueRightEqual}>= Rp.</Text>
                <Text style={styles.subValueRightAmount}>
                  -{formatCurrency(discount, invoice.currency)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Keterangan Row */}
        <View style={styles.subRow}>
          <View style={styles.subSpacer} />
          <Text style={styles.subLabel}>Keterangan</Text>
          <Text style={styles.subColon}>:</Text>
          <View style={styles.subValueContainer}>
            <Text style={styles.subValueLeft}>Lunas</Text>
            <View style={styles.subValueRight} />
          </View>
        </View>

        {/* TOTAL */}
        <View style={styles.totalRow}>
          <View style={styles.totalSpacer} />
          <Text style={styles.totalLabel}>T O T A L</Text>
          <View style={styles.totalEmptyColon} />
          <View style={styles.totalValueContainer}>
            <Text style={styles.totalEqualSign}>= Rp.</Text>
            <Text style={styles.totalAmountText}>
              {formatCurrency(total, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Double underline decoration */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <View style={styles.totalSpacer} />
          <View style={styles.totalLabel} />
          <View style={styles.totalEmptyColon} />
          <View style={styles.doubleLineContainer} />
        </View>

        {/* Signature Section */}
        <View style={styles.signatureBlockSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureDate}>{locationAndDate}</Text>
            <Text style={styles.signatureRole}>Yang menerima,</Text>
            <Text style={styles.signatureCompany}>{company.companyName || "CV ADITARA JAYA MAKMUR"}</Text>
            
            {company.signatureBase64 ? (
              <Image src={company.signatureBase64} style={styles.signatureImage} />
            ) : (
              <View style={{ height: 38 }} />
            )}
            
            <Text style={styles.signatureName}>
              {company.bankAccountHolder || "FAVIRRU BAGUS MAHARDHIKA"}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
