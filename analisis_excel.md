Berdasarkan file **`REPORT APRIL 2026.xlsx`** yang saya baca, perusahaan Anda (AJM) pada dasarnya beroperasi sebagai **Agen/Perantara (Broker)** untuk beton readymix. Anda membeli dari pabrik (*Plant*) lalu menjualnya lagi ke *Customer* dengan mengambil selisih harga (Margin).

Excel tersebut sangat terstruktur. Berikut adalah penjelasan sederhana mengenai apa saja yang dicatat di dalamnya:

### 1. Data Umum & Logistik
- **DATE, PLANT, SALES, CUSTOMER, PROYEK:** Ini adalah identitas transaksi. Mencatat kapan dikirim, dari pabrik mana (misal: *Malang*), siapa salesnya, siapa pembelinya, dan di mana lokasi proyeknya.
- **VOL & MUTU:** Mencatat berapa kubik (m³) yang dipesan dan tipe/spesifikasi betonnya (misal: *K250*, *K350*).

### 2. Blok Penjualan (Kolom "DEAL" / "AJM")
Ini adalah uang yang Anda tagihkan ke *Customer*.
- **DEAL:** Harga jual dasar per m³ (Tanpa PPN).
- **PPN:** Pajak 11% yang ditambahkan dari harga dasar.
- **HARGA + PPN:** Harga satuan per m³ setelah ditambah PPN.
- **TOTAL DEAL / TOTAL AJM:** Total uang yang akan dibayar pelanggan kepada Anda (*Volume × [Harga + PPN]*).

### 3. Blok Modal (Kolom "BUY IN")
Ini adalah uang yang Anda bayarkan ke pabrik penyuplai (*Supplier*).
- **BUY IN:** Harga beli dasar per m³ dari pabrik (modal awal Anda).
- **PPN:** Pajak 11% yang ditagihkan oleh pabrik kepada Anda.
- **TOTAL BUY IN:** Total uang yang keluar dari kantong Anda untuk membayar pabrik (*Volume × [Buy In + PPN]*).

### 4. Blok Keuntungan (Kolom "FEE" & "MARGIN")
Ini adalah jantung keuangan perusahaan Anda:
- **FEE:** Pengeluaran ekstra (misal: uang koordinasi lapangan, tips, atau komisi pihak ketiga). Angka ini akan **memotong** keuntungan Anda.
- **MARGIN / m³:** Selisih keuntungan murni per kubik. Rumusnya adalah `Harga DEAL Dasar - Harga BUY IN Dasar`. (Catatan: PPN tidak dihitung di sini karena PPN sifatnya hanya titipan).
- **TOTAL MARGIN:** Ini adalah **Laba Bersih** Anda! Rumusnya: `(Margin per m³ × Volume) - FEE`. 
- **SHARE MARGIN & TOTAL SHARE:** Digunakan jika laba bersih tersebut harus dibagi hasil (*profit sharing*) dengan rekanan atau sales eksternal (dalam nominal persentase tertentu).

---
**Kesimpulan untuk Aplikasi Kita:**
Sistem *Dashboard* dan *Invoice* yang sudah kita bangun **saat ini sudah 100% mengikuti cara kerja Excel ini**. Sistem otomatis memisahkan mana Harga Dasar dan mana PPN, sehingga perhitungan **Laba Bersih** (Total Margin) di aplikasi kita sekarang sudah sama persis akurasinya dengan Excel yang biasa dipakai admin Anda!