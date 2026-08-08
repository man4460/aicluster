-- Per-module slip paper size (independent of central profile)
ALTER TABLE `drink_pos_shop_profiles`
  ADD COLUMN `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58' AFTER `tax_id`;

ALTER TABLE `hotel_resort_profiles`
  ADD COLUMN `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58' AFTER `tax_id`;

ALTER TABLE `module_shop_brandings`
  ADD COLUMN `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58' AFTER `tax_id`;

ALTER TABLE `barber_shop_profiles`
  ADD COLUMN `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58' AFTER `bank_account_name`;

ALTER TABLE `massage_shop_profiles`
  ADD COLUMN `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58' AFTER `bank_account_name`;

ALTER TABLE `football_turf_shop_profiles`
  ADD COLUMN `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58' AFTER `note`;
