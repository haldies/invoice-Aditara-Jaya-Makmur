import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/apiAuth";
import { getProvinces, getRegencies } from "idn-area-data";

// Harga ongkir per wilayah berdasarkan kode provinsi
// Sesuaikan dengan tarif pengiriman beton yang umum
const RATE_BY_PROVINCE_PREFIX: Record<string, number> = {
  // DKI Jakarta
  "31": 0,      // gratis (area sendiri, sesuaikan)
  // Jawa Barat
  "32": 150_000,
  // Jawa Tengah
  "33": 200_000,
  // DI Yogyakarta
  "34": 200_000,
  // Jawa Timur
  "35": 225_000,
  // Banten
  "36": 150_000,
  // Bali
  "51": 275_000,
  // NTB
  "52": 350_000,
  // NTT
  "53": 400_000,
  // Aceh
  "11": 300_000,
  // Sumatera Utara
  "12": 275_000,
  // Sumatera Barat
  "13": 275_000,
  // Riau
  "14": 275_000,
  // Jambi
  "15": 275_000,
  // Sumatera Selatan
  "16": 275_000,
  // Bengkulu
  "17": 300_000,
  // Lampung
  "18": 250_000,
  // Kepulauan Bangka Belitung
  "19": 300_000,
  // Kepulauan Riau
  "21": 300_000,
  // Kalimantan Barat
  "61": 325_000,
  // Kalimantan Tengah
  "62": 325_000,
  // Kalimantan Selatan
  "63": 325_000,
  // Kalimantan Timur
  "64": 350_000,
  // Kalimantan Utara
  "65": 350_000,
  // Sulawesi Utara
  "71": 350_000,
  // Sulawesi Tengah
  "72": 350_000,
  // Sulawesi Selatan
  "73": 325_000,
  // Sulawesi Tenggara
  "74": 350_000,
  // Gorontalo
  "75": 350_000,
  // Sulawesi Barat
  "76": 350_000,
  // Maluku
  "81": 425_000,
  // Maluku Utara
  "82": 425_000,
  // Papua Barat
  "91": 500_000,
  // Papua
  "94": 500_000,
  // Papua Selatan
  "95": 500_000,
  // Papua Tengah
  "96": 500_000,
  // Papua Pegunungan
  "97": 500_000,
  // Papua Barat Daya
  "92": 500_000,
};

const FREE_PROVINCE = "31"; // Jakarta (sesuaikan)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return;

  if (user.role !== "admin" && user.role !== "owner" && user.role !== "manager") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const ownerId = user.role === "owner" ? user.id : await (async () => {
    const owner = await prisma.appUser.findFirst({ where: { role: "owner" } });
    return owner?.id || user.id;
  })();

  try {
    // Hapus semua ongkir lama milik owner ini dulu
    // @ts-ignore
    await prisma.shippingRate.deleteMany({ where: { user_id: ownerId } });

    // Ambil semua provinsi dan kota
    const [provinces, regencies] = await Promise.all([getProvinces(), getRegencies()]);
    const provMap = new Map(provinces.map(p => [p.code, p.name]));

    const now = new Date().toISOString();
    const records = regencies.map(r => {
      const provCode = r.province_code;
      const price = RATE_BY_PROVINCE_PREFIX[provCode] ?? 350_000;
      const isFree = provCode === FREE_PROVINCE;
      return {
        user_id: ownerId,
        area: r.name,
        price: isFree ? 0 : price,
        is_free: isFree,
        notes: provMap.get(provCode) ?? "",
        created_at: now,
        updated_at: now,
      };
    });

    // Batch insert 100 per chunk
    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      // @ts-ignore
      await prisma.shippingRate.createMany({ data: chunk, skipDuplicates: true });
      inserted += chunk.length;
    }

    return res.status(200).json({ message: `Berhasil import ${inserted} kota/kab dari seluruh Indonesia.`, count: inserted });
  } catch (error: any) {
    console.error("Seed error:", error);
    return res.status(500).json({ error: error.message });
  }
}
