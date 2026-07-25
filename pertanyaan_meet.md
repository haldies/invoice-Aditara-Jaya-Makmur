# 📋 Daftar Pertanyaan – Pre-Meeting Sistem AJM

> Dokumen ini berisi poin-poin yang perlu dikonfirmasi sebelum fitur diimplementasikan secara final ke dalam sistem.

---

## 1. 💰 Pajak (PPN)

**Konteks:** Di Excel ada kolom PPN 11% yang ditambahkan di atas harga Deal dan juga di atas harga Beli ke Supplier.

**Pertanyaan:**
- [ ] Apakah PPN 11% selalu berlaku untuk **semua transaksi**? Atau ada pelanggan tertentu yang dikecualikan (misalnya pelanggan non-PKP atau proyek pemerintah)?
- [ ] Apakah tagihan ke pelanggan **selalu pakai PPN**? Atau ada yang harga sudah "all-in" (sudah termasuk PPN)?
- [ ] Apakah sistem perlu menampilkan PPN secara terpisah di invoice PDF, atau cukup total akhir saja?
- [ ] Apakah ada transaksi dengan **tarif pajak berbeda** (misalnya PPh, PPN 12%, dll)?

---

## 2. 📦 Fee

**Konteks:** Di Excel ada kolom FEE yang memotong margin/laba bersih. Artinya fee bukan dibayar pelanggan — tapi dibebankan ke perusahaan dari keuntungan.

**Pertanyaan:**
- [ ] Fee itu untuk apa saja? (contoh: uang koordinasi lapangan, tips mandor, komisi pihak ketiga, ongkos kirim, dll)
- [ ] Apakah fee diinput **per invoice** atau **per item produk**?
- [ ] Apakah ada standar besaran fee, atau bebas sesuai kondisi di lapangan?
- [ ] Apakah fee perlu **diinput oleh Admin** saat buat invoice, atau dicatat setelah fakta?

---

## 3. 🤝 Komisi Sales

**Konteks:** Sekarang sistem menghitung komisi dari `Volume Aktual × Rate per m³` (default Rp 5.000/m³). Tapi dari data Excel terlihat angkanya bervariasi.

**Pertanyaan:**
- [ ] Apakah komisi dihitung **per m³** (volume) atau **persentase dari deal/margin**?
- [ ] Apakah setiap Sales punya tarif komisi yang berbeda? (Contoh: Sales A = 5.000/m³, Sales B = 2.000/m³)
- [ ] Apakah tarif komisi bisa **berbeda per transaksi/proyek**, atau cukup tarif tetap per Sales?
- [ ] Apakah komisi dibayarkan setelah pengiriman aktual terjadi, atau setelah invoice lunas?
- [ ] Apakah komisi hanya berlaku untuk **produk beton**, atau juga Wiremesh, Jasa, dll?

---

## 4. 🏭 Harga Beli ke Supplier (HPP / Buy In)

**Konteks:** Dari data Excel, harga Buy In per mutu sering berbeda-beda meskipun mutu sama — tergantung plant, tanggal, dan negosiasi.

**Pertanyaan:**
- [ ] Apakah kita perlu **harga referensi/standar** per mutu di katalog sebagai titik awal, lalu Admin boleh override saat input invoice?
- [ ] Atau harga beli selalu **diisi manual 100%** tanpa referensi (form bebas)?
- [ ] Kalau ada standar harga, siapa yang update harga standar itu? (Admin / Owner saja?)
- [ ] Apakah harga beli perlu dicatat per **plant/supplier** (Malang vs Gempol vs Kediri berbeda harga)?

---

## 5. 🗂️ Katalog Produk

**Konteks:** Saat ini katalog berisi nama produk tanpa harga (harga wajib diisi manual tiap transaksi).

**Pertanyaan:**
- [ ] Apakah cukup katalog hanya berisi **nama produk** saja (seperti sekarang)?
- [ ] Atau perlu ada **harga standar default** yang bisa di-override? (Misal: K-300 default Rp 800.000, tapi Admin bisa ganti)
- [ ] Apakah perlu ada fitur **riwayat harga** — bisa lihat harga terakhir yang dipakai untuk mutu/plant tertentu, supaya Admin tidak perlu hafal?

---

## 6. 💳 Pencatatan Hutang Supplier (AP) & Piutang Customer (AR)

**Konteks:** 
- Saat transaksi berstatus **PO / Pengiriman**, timbul **Hutang Usaha ke Supplier** (Total Buy In + PPN Supplier).
- Saat transaksi berstatus **Tagihan / Invoice**, timbul **Piutang Customer** (Total Deal) yang harus ditagih hingga lunas (`Selesai`).

**Pertanyaan:**
- [ ] Apakah perlu ada status / pencatatan khusus untuk **Lunas Pembayaran ke Supplier** secara terpisah dari status **Lunas Pembayaran dari Customer**? (misalnya: Customer sudah lunas, tapi kita belum bayar ke Jayamix, atau sebaliknya).
- [ ] Apakah perlu ada reminder / notifikasi otomatis tanggal jatuh tempo pembayaran ke supplier?

---

> **Catatan untuk developer:** Jawaban atas pertanyaan di atas akan menentukan apakah perlu ada perubahan di schema database, form invoice, dan logika kalkulasi dashboard.
