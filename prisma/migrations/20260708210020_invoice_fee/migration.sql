-- Add fee column to invoices table
-- Fee = biaya/komisi yang dibebankan, dikurangi dari margin (bukan dari total tagihan customer)
ALTER TABLE "invoices" ADD COLUMN "fee" DOUBLE PRECISION NOT NULL DEFAULT 0;
