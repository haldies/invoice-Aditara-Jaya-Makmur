import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { getUnit, formatQuantity, formatClientAddress } from "@/lib/pdfUtils";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: "#000",
    backgroundColor: "#fff",
  },
  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    fontFamily: "Helvetica",
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
  },
  logoRight: {
    width: 80,
    height: 40,
    objectFit: "contain",
  },

  // Title
  title: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 20,
  },

  // Form Fields
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    width: 140,
    fontFamily: "Times-Bold",
  },
  colon: {
    width: 10,
    fontFamily: "Times-Bold",
  },
  valueContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
  },
  valueText: {
    fontFamily: "Times-Roman",
  },
  
  // Sub items
  subRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  subSpacer: {
    width: 150,
  },
  subLabel: {
    width: 90,
    fontFamily: "Times-Bold",
  },
  subColon: {
    width: 10,
    fontFamily: "Times-Bold",
  },
  subValueContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subValueLeft: {
    flex: 1,
  },
  subValueLeftKeteranganContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
  },
  subValueRight: {
    flexDirection: "row",
    width: 130,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
  },
  subValueRightEq: {
    width: 30,
    fontFamily: "Times-Bold",
  },
  subValueRightAmount: {
    flex: 1,
    textAlign: "right",
  },

  // Total
  totalRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  totalLabel: {
    width: 250, // subSpacer (150) + subLabel (90) + subColon (10)
    fontFamily: "Times-Bold",
    letterSpacing: 3,
    textAlign: "center",
  },
  totalValueRight: {
    flexDirection: "row",
    width: 130,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
  },
  totalValueRightEq: {
    width: 30,
    fontFamily: "Times-Bold",
  },
  totalValueRightAmount: {
    flex: 1,
    textAlign: "right",
    fontFamily: "Times-Bold",
  },
  doubleLineContainer: {
    flexDirection: "row",
    marginTop: 2,
  },
  doubleLineSpacer: {
    width: 250,
  },
  doubleLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 2,
    width: 130,
  },

  // Signature Block
  signatureBlock: {
    marginTop: 40,
    alignItems: "flex-end",
    paddingRight: 20,
  },
  signatureBox: {
    width: 200,
    alignItems: "center",
  },
  signatureText: {
    marginBottom: 3,
  },
  signatureCompany: {
    fontFamily: "Times-Bold",
    marginBottom: 10,
  },
  signatureName: {
    fontFamily: "Times-Bold",
    textDecoration: "underline",
    marginTop: 40,
  },
  signatureImg: {
    width: 90,
    height: 40,
    objectFit: "contain",
    position: "absolute",
    top: 40,
  }
});

const fmtAmt = (n: number) => {
  if (!n) return "0,00";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
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
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${months[monthIdx]} ${year}`;
    }
  } catch (e) {}
  return dateStr;
}

interface Props { invoice: Invoice; company: CompanyProfile; includePpn: boolean; }

export const ReceiptPDF = ({ invoice, company, includePpn }: Props) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
  const discount = Number(invoice.discount || 0);
  const tax = includePpn ? Math.round(subtotal * 0.11) : Number(invoice.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);

  const formattedDate = formatDateIndo(invoice.paid_date || invoice.issue_date || new Date().toISOString().slice(0, 10));
  const locationAndDate = company.city 
    ? `${company.city.split(",")[0]}, ${formattedDate}` 
    : formattedDate;

  const primaryItem = invoice.items[0];

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
            {company.logoRightBase64 && <Image src={company.logoRightBase64} style={styles.logoRight} />}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>KWITANSI</Text>

        {/* TELAH TERIMA DARI */}
        <View style={styles.row}>
          <Text style={styles.label}>TELAH TERIMA DARI</Text>
          <Text style={styles.colon}>:</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{invoice.client.company || invoice.client.name}</Text>
          </View>
        </View>

        {/* ALAMAT */}
        <View style={styles.row}>
          <Text style={styles.label}>ALAMAT</Text>
          <Text style={styles.colon}>:</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{formatClientAddress(invoice.client) || "-"}</Text>
          </View>
        </View>

        {/* PROYEK */}
        <View style={styles.row}>
          <Text style={styles.label}>PROYEK</Text>
          <Text style={styles.colon}>:</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{invoice.notes || "-"}</Text>
          </View>
        </View>

        {/* UNTUK PEMBAYARAN */}
        <View style={styles.row}>
          <Text style={styles.label}>UNTUK PEMBAYARAN</Text>
          <Text style={styles.colon}>:</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>
              Beton Jadi / Mutu : {primaryItem ? primaryItem.description : "-"}
            </Text>
          </View>
        </View>

        {/* Items */}
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
                  {qtyDisplay} @ Rp {fmtAmt(Number(item.unit_price))}
                </Text>
                <View style={styles.subValueRight}>
                  <Text style={styles.subValueRightEq}>= Rp.</Text>
                  <Text style={styles.subValueRightAmount}>
                    {fmtAmt(Number(item.quantity) * Number(item.unit_price))}
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
                <Text style={styles.subValueRightEq}>= Rp.</Text>
                <Text style={styles.subValueRightAmount}>
                  {fmtAmt(tax)}
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
          <View style={styles.subValueLeftKeteranganContainer}>
            <Text style={styles.valueText}>Lunas</Text>
          </View>
        </View>

        {/* TOTAL */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>T O T A L</Text>
          <View style={styles.totalValueRight}>
            <Text style={styles.totalValueRightEq}>= Rp.</Text>
            <Text style={styles.totalValueRightAmount}>
              {fmtAmt(total)}
            </Text>
          </View>
        </View>
        <View style={styles.doubleLineContainer}>
          <View style={styles.doubleLineSpacer} />
          <View style={styles.doubleLine} />
        </View>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>{locationAndDate}</Text>
            <Text style={styles.signatureText}>Yang menerima,</Text>
            <Text style={styles.signatureCompany}>{company.companyName || "CV ADITARA JAYA MAKMUR"}</Text>
            
            {company.signatureBase64 && (
              <Image src={company.signatureBase64} style={styles.signatureImg} />
            )}
            
            <Text style={styles.signatureName}>
              {(invoice.user as any)?.name || company.bankAccountHolder || "FAVIRRU BAGUS MAHARDHIKA"}
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
