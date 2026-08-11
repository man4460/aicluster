-- AlterTable
ALTER TABLE `barber_customers` ADD COLUMN `tax_invoice_enabled` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `barber_customers` ADD COLUMN `billing_name` VARCHAR(160) NOT NULL DEFAULT '';
ALTER TABLE `barber_customers` ADD COLUMN `tax_id` VARCHAR(30) NOT NULL DEFAULT '';
ALTER TABLE `barber_customers` ADD COLUMN `tax_address` VARCHAR(1000) NOT NULL DEFAULT '';
ALTER TABLE `barber_customers` ADD COLUMN `tax_branch` VARCHAR(120) NOT NULL DEFAULT '';
