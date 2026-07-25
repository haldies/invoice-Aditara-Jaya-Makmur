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
  dateLocation: {
    fontSize: 9.5,
    marginBottom: 10,
    textAlign: "left",
  },
  recipientBlock: {
    marginBottom: 15,
    lineHeight: 1.3,
  },
  recipientLabel: {
    fontFamily: "Times-Bold",
  },
  recipientName: {
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
  },
  perihal: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    marginTop: 10,
    marginBottom: 12,
    textDecoration: "underline",
  },
  openingText: {
    marginBottom: 12,
    lineHeight: 1.3,
  },
  table: {
    width: "100%",
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingVertical: 5,
  },
  tableHeaderCell: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    paddingVertical: 6,
  },
  colNo: { width: 30, textAlign: "center" },
  colDesc: { flex: 1 },
  colSatuan: { width: 60, textAlign: "center" },
  colPrice: { width: 120, textAlign: "right" },
  colKet: { width: 80, textAlign: "center" },
  
  cellText: {
    fontSize: 9,
    paddingHorizontal: 5,
  },
  
  termsSection: {
    marginTop: 10,
    marginBottom: 15,
  },
  termsTitle: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    marginBottom: 4,
  },
  termsRow: {
    flexDirection: "row",
    marginBottom: 3,
    lineHeight: 1.25,
  },
  termsIndex: {
    width: 15,
    fontSize: 9,
  },
  termsText: {
    flex: 1,
    fontSize: 9,
  },
  
  closingText: {
    marginBottom: 20,
    lineHeight: 1.3,
  },
  
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
  },
  signatureBox: {
    width: "30%",
    alignItems: "center",
    textAlign: "center",
  },
  signatureTitle: {
    fontSize: 9.5,
    marginBottom: 35,
    height: 12,
  },
  signatureImage: {
    width: 75,
    height: 35,
    objectFit: "contain",
    position: "absolute",
    top: 15,
  },
  signatureName: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    textDecoration: "underline",
    textTransform: "uppercase",
    marginTop: 5,
  },
  signatureSubtitle: {
    fontSize: 8.5,
    color: "#333",
    marginTop: 1,
  },
});



const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format Date to Indonesia format: 20 Januari 2026
const formatIndonesianDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const year = parts[0];
    const month = months[parseInt(parts[1], 10) - 1];
    const day = parseInt(parts[2], 10);
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

interface Props {
  invoice: Invoice;
  company: CompanyProfile;
  includePpn?: boolean;
}

export const QuotationPDF = ({ invoice, company, includePpn = false }: Props) => {
  const formattedDate = formatIndonesianDate(invoice.issue_date);

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

        {/* Date and Location */}
        <Text style={styles.dateLocation}>
          Sidoarjo, {formattedDate}
        </Text>

        {/* Recipient Block */}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientLabel}>Kepada Yth.</Text>
          <Text style={styles.recipientName}>{invoice.client.company || invoice.client.name}</Text>
          {invoice.client.address ? (
            <Text style={{ fontSize: 9.5 }}>{invoice.client.address}</Text>
          ) : null}
        </View>

        {/* Subject */}
        <Text style={styles.perihal}>Perihal : SURAT PENAWARAN HARGA PRODUK</Text>

        {/* Opening */}
        <Text style={styles.openingText}>
          Dengan hormat,{"\n"}
          Kami dari {company.companyName || "CV ADITARA JAYA MAKMUR"} ingin memberikan penawaran harga untuk produk JAYAMIX yaitu :
        </Text>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNo]}>No.</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Deskripsi Produk</Text>
            <Text style={[styles.tableHeaderCell, styles.colSatuan]}>Satuan</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Harga</Text>
            <Text style={[styles.tableHeaderCell, styles.colKet]}>Keterangan</Text>
          </View>
          {invoice.items.map((item, index) => {
            const unit = getUnit(item.description);
            const qtyFormatted = formatQuantity(Number(item.quantity));
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.colNo]}>{index + 1}.</Text>
                <Text style={[styles.cellText, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.cellText, styles.colSatuan]}>{unit}</Text>
                <Text style={[styles.cellText, styles.colPrice]}>
                  {formatCurrency(Number(item.unit_price), invoice.currency)}{unit ? `/${unit}` : ""}
                </Text>
                <Text style={[styles.cellText, styles.colKet]}>{qtyFormatted}</Text>
              </View>
            );
          })}
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Dengan ketentuan sebagai berikut :</Text>
          <View style={styles.termsRow}>
            <Text style={styles.termsIndex}>1.</Text>
            <Text style={styles.termsText}>
              {includePpn ? "Harga sudah termasuk PPN 11%" : "Harga belum termasuk PPN 11%"}
            </Text>
          </View>
          <View style={styles.termsRow}>
            <Text style={styles.termsIndex}>2.</Text>
            <Text style={styles.termsText}>
              Pembayaran Cash/Giro/Transfer ke Rek. BCA 150.455.5758 a.n. ADITARA JAYA MAKMUR CV, Pembayaran sebelum pengiriman.
            </Text>
          </View>
          <View style={styles.termsRow}>
            <Text style={styles.termsIndex}>3.</Text>
            <Text style={styles.termsText}>Setiap kenaikan slump +2 cm dikenakan tambahan harga Rp 30.000,00/m³</Text>
          </View>
          <View style={styles.termsRow}>
            <Text style={styles.termsIndex}>4.</Text>
            <Text style={styles.termsText}>Pemakaian batu screening dikenakan tambahan harga Rp 30.000,00/m³</Text>
          </View>
          <View style={styles.termsRow}>
            <Text style={styles.termsIndex}>5.</Text>
            <Text style={styles.termsText}>Pengetesan dilakukan di laboratorium JAYAMIX</Text>
          </View>
          <View style={styles.termsRow}>
            <Text style={styles.termsIndex}>6.</Text>
            <Text style={styles.termsText}>Biaya pengetesan benda uji diluar laboratorium JAYAMIX dibebankan ke pelanggan</Text>
          </View>
        </View>

        {/* Closing */}
        <Text style={styles.closingText}>
          Demikian surat ini disampaikan. Apabila ada perubahan harga, kami akan memberikan informasi lebih lanjut. Terima kasih atas perhatian dan kerjasamanya.
        </Text>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Hormat kami,</Text>
            {company.signatureBase64 ? (
              <Image src={company.signatureBase64} style={styles.signatureImage} />
            ) : null}
            <Text style={[styles.signatureName, { marginTop: 40 }]}>FAVIRRU B. M.</Text>
            <Text style={styles.signatureSubtitle}>Sales Manager</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Mengetahui,</Text>
            <Text style={[styles.signatureName, { marginTop: 40 }]}>
              {invoice.client.company || invoice.client.name}
            </Text>
            <Text style={styles.signatureSubtitle}>Customer</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Menyetujui,</Text>
            <Text style={[styles.signatureName, { marginTop: 40 }]}>___________________</Text>
            <Text style={styles.signatureSubtitle}>Direktur Customer</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
