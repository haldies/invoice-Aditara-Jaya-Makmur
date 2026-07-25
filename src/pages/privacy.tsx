import { LegalPage } from "@/components/legal/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy / Kebijakan Privasi">
      <h2>Bahasa Indonesia</h2>
      <p>
        LokerHub memproses data yang Anda masukkan untuk menyediakan manajemen
        invoice dan autentikasi.
      </p>
      <h3>Data yang diproses</h3>
      <ul>
        <li>Informasi akun seperti email dan ID pengguna.</li>

        <li>
          Informasi invoice seperti client, nomor invoice, status, tanggal,
          item jasa, pajak, diskon, total, catatan, dan syarat pembayaran.
        </li>
        <li>Data teknis minimum untuk keamanan dan operasi layanan.</li>
      </ul>
      <h3>Penggunaan dan pembagian data</h3>
      <p>
        Data digunakan hanya untuk menjalankan fitur yang Anda minta. Supabase
        menyediakan hosting database dan autentikasi.
      </p>
      <h3>Penyimpanan, penghapusan, dan hak Anda</h3>
      <p>
        Data disimpan selama akun aktif. Anda dapat menghapus akun dan seluruh
        data aplikasi secara permanen dari Settings. Backup atau log operasional
        dapat bertahan sementara sesuai siklus retensi penyedia infrastruktur.
        Anda dapat mengakses, memperbarui, mengekspor, atau menghapus data
        melalui aplikasi.
      </p>
      <h3>Keamanan</h3>
      <p>
        LokerHub menggunakan autentikasi, isolasi data per pengguna, dan koneksi
        terenkripsi. Tidak ada sistem yang sepenuhnya bebas risiko.
      </p>

      <h2>English</h2>
      <p>
        LokerHub processes information you provide to operate the application
        invoice manager and authentication.
      </p>
      <h3>Data we process</h3>
      <ul>
        <li>Account information such as email and user ID.</li>

        <li>
          Invoice information including client, invoice number, status, dates,
          service items, tax, discount, total, notes, and payment terms.
        </li>
        <li>Minimum technical data needed for security and operation.</li>
      </ul>
      <h3>Use and sharing</h3>
      <p>
        Data is used to provide requested features. Supabase provides database
        hosting and authentication.
      </p>
      <h3>Retention, deletion, security, and rights</h3>
      <p>
        Data is retained while your account remains active. Settings provides
        permanent account and application-data deletion. Temporary
        infrastructure backups or operational logs may remain for the
        provider&apos;s normal retention cycle. You may access, update, export,
        or delete your data. LokerHub uses authentication, per-user isolation,
        and encrypted connections, but no system is entirely risk-free.
      </p>
    </LegalPage>
  );
}
