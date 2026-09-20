-- Laundry package quota unit (SESSION | PIECE) + units deducted per PACKAGE_USE log
ALTER TABLE `laundry_packages`
  ADD COLUMN `quota_unit` VARCHAR(16) NOT NULL DEFAULT 'SESSION' AFTER `total_sessions`;

ALTER TABLE `laundry_service_logs`
  ADD COLUMN `units_deducted` INT NOT NULL DEFAULT 1 AFTER `signature_image_url`;
