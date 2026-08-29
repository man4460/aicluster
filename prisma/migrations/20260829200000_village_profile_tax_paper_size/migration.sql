-- Village profile: tax ID + default print paper size (58 / 80 / A4)
ALTER TABLE `village_profiles` ADD COLUMN `tax_id` VARCHAR(30) NULL;
ALTER TABLE `village_profiles` ADD COLUMN `default_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58';
