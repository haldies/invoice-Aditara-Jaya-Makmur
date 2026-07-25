import { LegalPage } from "@/components/legal/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service / Ketentuan Layanan">
      <h2>Bahasa Indonesia</h2>
      <p>
        Dengan menggunakan LokerHub, Anda setuju menggunakan layanan secara sah,
        menjaga keamanan kredensial, dan bertanggung jawab atas data yang Anda
        masukkan.
      </p>
      <h3>Penggunaan layanan</h3>
      <ul>
        <li>Jangan mengakses akun atau data milik orang lain.</li>
        <li>Jangan menyalahgunakan API atau infrastruktur layanan.</li>
        <li>
          Tinjau hasil invoice sebelum menggunakannya untuk keputusan penting.
        </li>
      </ul>
      <h3>Ketersediaan dan tanggung jawab</h3>
      <p>
        LokerHub disediakan sebagaimana adanya dan dapat berubah. Kami tidak
        menjamin pekerjaan, interview, kompatibilitas ATS tertentu, atau
        ketersediaan tanpa gangguan. Sejauh diizinkan hukum, LokerHub tidak
        bertanggung jawab atas kerugian tidak langsung dari penggunaan layanan.
      </p>
      <h3>Pengakhiran</h3>
      <p>
        Anda dapat berhenti dan menghapus akun kapan saja. Akses dapat dibatasi
        untuk pelanggaran ketentuan, risiko keamanan, atau kewajiban hukum.
      </p>

      <h2>English</h2>
      <p>
        By using LokerHub, you agree to use the service lawfully, protect your
        credentials, and remain responsible for submitted data.
      </p>
      <h3>Acceptable use</h3>
      <ul>
        <li>Do not access another person&apos;s account or data.</li>
        <li>Do not abuse the API or infrastructure.</li>
        <li>
          Review invoice output before relying on them for important decisions.
        </li>
      </ul>
      <h3>Availability, liability, and termination</h3>
      <p>
        LokerHub is provided as available and may change. We do not guarantee
        employment, interviews, a particular ATS result, or uninterrupted
        availability. To the extent allowed by law, LokerHub is not liable for
        indirect losses arising from use of the service. You may stop using and
        delete your account at any time.
      </p>
    </LegalPage>
  );
}
