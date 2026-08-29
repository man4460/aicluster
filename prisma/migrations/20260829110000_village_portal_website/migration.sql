-- AlterTable
ALTER TABLE `village_profiles`
  ADD COLUMN `tagline` VARCHAR(300) NULL,
  ADD COLUMN `logo_url` VARCHAR(512) NULL,
  ADD COLUMN `contact_line` VARCHAR(120) NULL,
  ADD COLUMN `facebook_url` VARCHAR(512) NULL,
  ADD COLUMN `map_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_banner_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_gallery_json` JSON NULL;
