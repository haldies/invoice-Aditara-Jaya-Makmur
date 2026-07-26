import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { getUnit, formatQuantity } from "@/lib/pdfUtils";

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
    marginBottom: 10,
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
    alignItems: "flex-end",
  },
  dealerText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginTop: 25,
  },

  dateLocation: {
    textAlign: "right",
    marginBottom: 20,
    fontSize: 9,
  },

  // Recipient
  recipientBlock: {
    marginBottom: 20,
    lineHeight: 1.3,
  },
  recipientLabel: {
    fontFamily: "Helvetica-Bold",
  },

  // Perihal
  perihalBlock: {
    flexDirection: "row",
    marginBottom: 15,
  },
  perihalLabel: {
    fontFamily: "Helvetica-Bold",
    width: 50,
  },
  perihalColon: { width: 15 },
  perihalVal: {
    fontFamily: "Helvetica-Bold",
  },

  // Opening
  openingText: {
    marginBottom: 10,
    lineHeight: 1.3,
  },

  // Table
  table: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
    marginBottom: 20,
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
  },
  th: {
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  colNo: { width: "8%", textAlign: "center" },
  colDesc: { width: "42%" },
  colSatuan: { width: "10%", textAlign: "center" },
  colPrice: { width: "22%" },
  colKet: { width: "18%", textAlign: "center" },
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

  // Terms
  termsSection: {
    marginBottom: 20,
  },
  termsTitle: {
    marginBottom: 4,
  },
  termsRow: {
    flexDirection: "row",
    marginBottom: 3,
    lineHeight: 1.3,
  },
  termsIndex: {
    width: 15,
  },
  termsText: {
    flex: 1,
  },

  // Closing
  closingText: {
    marginBottom: 20,
    lineHeight: 1.3,
  },

  // Signatures
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
  },
  signatureBoxLeft: { width: "30%" },
  signatureBoxMid: { width: "30%", alignItems: "center" },
  signatureBoxRight: { width: "30%", alignItems: "center" },
  signatureTitle: {
    marginBottom: 5,
  },
  signatureImage: {
    width: 90,
    height: 45,
    objectFit: "contain",
  },
  signatureSpace: { height: 45 },
  signatureName: {
    marginTop: 5,
  },
});

const fmtAmt = (n: number) => {
  if (!n) return "0,00";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

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
            <Text style={styles.dealerText}>Authorized Dealer of Jayamix</Text>
          </View>
        </View>

        {/* Date */}
        <Text style={styles.dateLocation}>
          {company.city || "Sidoarjo"}, {formattedDate}
        </Text>

        {/* Recipient Block */}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientLabel}>Kepada Yth.</Text>
          <Text>{invoice.client.company || invoice.client.name}</Text>
          {invoice.client.address ? (
            <Text>{invoice.client.address}</Text>
          ) : null}
        </View>

        {/* Subject */}
        <View style={styles.perihalBlock}>
          <Text style={styles.perihalLabel}>Perihal</Text>
          <Text style={styles.perihalColon}>:</Text>
          <Text style={styles.perihalVal}>SURAT PENAWARAN HARGA PRODUK</Text>
        </View>

        {/* Opening */}
        <Text style={styles.openingText}>
          Dengan hormat,{"\n"}
          Kami dari {company.companyName || "CV ADITARA JAYA MAKMUR"} ingin memberikan penawaran harga untuk produk JAYAMIX yaitu :
        </Text>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tr}>
            <View style={[styles.tdBase, styles.th, styles.colNo]}><Text>No.</Text></View>
            <View style={[styles.tdBase, styles.th, styles.colDesc]}><Text>Deskripsi Produk</Text></View>
            <View style={[styles.tdBase, styles.th, styles.colSatuan]}><Text>Satuan</Text></View>
            <View style={[styles.tdBase, styles.th, styles.colPrice]}><Text>Harga</Text></View>
            <View style={[styles.tdBase, styles.th, styles.colKet]}><Text>Keterangan</Text></View>
          </View>
          {invoice.items.map((item, index) => {
            const unit = getUnit(item.description);
            const priceStr = item.unit_price ? fmtAmt(Number(item.unit_price)) : "";
            const qtyStr = item.quantity ? formatQuantity(Number(item.quantity)) : "";
            return (
              <View key={index} style={styles.tr}>
                <View style={[styles.tdBase, styles.colNo]}>
                  <Text>{index + 1}.</Text>
                </View>
                <View style={[styles.tdBase, styles.colDesc]}>
                  <Text>{item.description}</Text>
                </View>
                <View style={[styles.tdBase, styles.colSatuan]}>
                  <Text>{unit || " "}</Text>
                </View>
                <View style={[styles.tdBase, styles.colPrice]}>
                  {item.unit_price ? (
                    <View style={styles.currencyCell}>
                      <Text style={styles.currencyRp}>Rp</Text>
                      <Text style={styles.currencyVal}>{priceStr}{unit ? `/${unit}` : ""}</Text>
                    </View>
                  ) : <Text> </Text>}
                </View>
                <View style={[styles.tdBase, styles.colKet]}>
                  <Text>{qtyStr || " "}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Terms */}
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
              Pembayaran {paymentText}, Pembayaran sebelum pengiriman
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
          <View style={styles.signatureBoxLeft}>
            <Text style={{ marginBottom: 15 }}>Hormat kami,</Text>
            <Text style={styles.signatureTitle}>Dibuat oleh :</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>Sales</Text>
          </View>

          <View style={styles.signatureBoxMid}>
            <Text style={{ marginBottom: 15 }}> </Text>
            <Text style={styles.signatureTitle}>Mengetahui :</Text>
            {company.signatureBase64 ? (
              <Image src={company.signatureBase64} style={styles.signatureImage} />
            ) : (
              <View style={styles.signatureSpace} />
            )}
            <Text style={styles.signatureName}>{(invoice.user as any)?.name || "Favirru B. M."}</Text>
            <Text>Direktur</Text>
          </View>

          <View style={styles.signatureBoxRight}>
            <Text style={{ marginBottom: 15 }}> </Text>
            <Text style={styles.signatureTitle}>Menyetujui,</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>{invoice.client.company || invoice.client.name}</Text>
            <Text>Customer</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
