-- AlterTable
ALTER TABLE `module_list`
  ADD COLUMN `try_promo_videos_json` TEXT NOT NULL DEFAULT ('[]'),
  ADD COLUMN `try_promo_banner_url` VARCHAR(512) NULL;
