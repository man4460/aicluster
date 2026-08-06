-- AlterTable
ALTER TABLE `football_turf_promotion_sales`
  ADD COLUMN `payment_method` VARCHAR(20) NOT NULL DEFAULT 'ONSITE',
  ADD COLUMN `payment_status` VARCHAR(20) NOT NULL DEFAULT 'PAID',
  ADD COLUMN `payment_slip_data_url` TEXT NULL,
  ADD COLUMN `payment_reference` VARCHAR(120) NOT NULL DEFAULT '';
