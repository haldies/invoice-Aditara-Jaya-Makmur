-- Migration: add buy_in_price to invoice_preset_items, add actual_quantity to invoice_items

-- Add buy_in_price to preset items (HPP / harga beli ke supplier, default 0)
ALTER TABLE "invoice_preset_items" ADD COLUMN "buy_in_price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add actual_quantity to invoice items (volume aktual terkirim, nullable - diisi admin saat selesai)
ALTER TABLE "invoice_items" ADD COLUMN "actual_quantity" DOUBLE PRECISION;
