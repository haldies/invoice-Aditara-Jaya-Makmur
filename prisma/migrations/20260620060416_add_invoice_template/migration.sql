-- DropForeignKey
ALTER TABLE "app_sessions" DROP CONSTRAINT "app_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cv_data" DROP CONSTRAINT "cv_data_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cv_versions" DROP CONSTRAINT "cv_versions_user_id_fkey";

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cv_data" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cv_versions" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "invoice_items" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "template_id" UUID,
ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_templates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "invoice_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "invoice_templates_user_id_idx" ON "invoice_templates"("user_id");

-- AddForeignKey
ALTER TABLE "app_sessions" ADD CONSTRAINT "app_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "invoice_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
