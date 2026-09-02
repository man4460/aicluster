-- AlterTable
ALTER TABLE `laundry_service_logs`
  ADD COLUMN `signature_image_url` VARCHAR(512) NULL AFTER `receipt_image_url`;
