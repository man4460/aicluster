-- AlterTable
ALTER TABLE `barber_shop_profiles`
  ADD COLUMN `tagline` VARCHAR(300) NULL,
  ADD COLUMN `contact_line` VARCHAR(120) NULL,
  ADD COLUMN `facebook_url` VARCHAR(512) NULL,
  ADD COLUMN `map_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_banner_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_gallery_json` TEXT NOT NULL DEFAULT ('[]');
