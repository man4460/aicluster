-- AlterTable
ALTER TABLE `football_turf_customers`
  ADD COLUMN `tax_invoice_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `billing_name` VARCHAR(160) NOT NULL DEFAULT '',
  ADD COLUMN `tax_id` VARCHAR(30) NOT NULL DEFAULT '',
  ADD COLUMN `tax_address` VARCHAR(1000) NOT NULL DEFAULT '',
  ADD COLUMN `tax_branch` VARCHAR(120) NOT NULL DEFAULT '';
