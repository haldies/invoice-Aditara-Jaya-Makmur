CREATE TABLE IF NOT EXISTS "company_profile_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "npwp" TEXT NOT NULL,
  "bank_name" TEXT NOT NULL,
  "bank_account" TEXT NOT NULL,
  "bank_account_holder" TEXT NOT NULL,
  "logo_base64" TEXT NOT NULL DEFAULT '',
  "logo_right_base64" TEXT NOT NULL DEFAULT '',
  "signature_base64" TEXT NOT NULL DEFAULT '',
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CONSTRAINT "company_profile_settings_pkey" PRIMARY KEY ("id")
);
