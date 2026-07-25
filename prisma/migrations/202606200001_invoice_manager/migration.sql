-- Convert job tracker data model to client invoice management.
-- Existing job application data is intentionally removed per product reset.

DROP TABLE IF EXISTS "job_applications" CASCADE;

ALTER TABLE "app_users"
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS "clients" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "company" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CONSTRAINT "clients_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "clients_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "currency" TEXT NOT NULL DEFAULT 'IDR',
  "issue_date" TEXT NOT NULL,
  "due_date" TEXT,
  "paid_date" TEXT,
  "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "terms" TEXT,
  "cv_version_id" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoices_user_id_invoice_number_key" UNIQUE ("user_id", "invoice_number"),
  CONSTRAINT "invoices_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "invoices_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "invoices_cv_version_id_fkey"
    FOREIGN KEY ("cv_version_id") REFERENCES "cv_versions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id" UUID NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "line_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoice_items_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "clients_user_id_name_idx" ON "clients"("user_id", "name");
CREATE INDEX IF NOT EXISTS "invoices_user_id_created_at_idx" ON "invoices"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "invoices_user_id_status_idx" ON "invoices"("user_id", "status");
CREATE INDEX IF NOT EXISTS "invoices_client_id_idx" ON "invoices"("client_id");
CREATE INDEX IF NOT EXISTS "invoice_items_invoice_id_sort_order_idx" ON "invoice_items"("invoice_id", "sort_order");
