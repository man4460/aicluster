-- AlterTable
ALTER TABLE `football_turf_shop_profiles`
  ADD COLUMN `portal_banner_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_gallery_json` TEXT NULL,
  ADD COLUMN `facebook_url` VARCHAR(512) NOT NULL DEFAULT '',
  ADD COLUMN `map_url` VARCHAR(512) NOT NULL DEFAULT '';

UPDATE `football_turf_shop_profiles`
SET `portal_gallery_json` = '[]'
WHERE `portal_gallery_json` IS NULL;
