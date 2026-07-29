-- Add payment history for partial payment tracking
ALTER TABLE "invoices"
ADD COLUMN IF NOT EXISTS "payment_history" JSONB NOT NULL DEFAULT '[]'::jsonb;
