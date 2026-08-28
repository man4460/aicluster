-- AlterTable
ALTER TABLE `dormitory_profiles`
  ADD COLUMN `manager_name` VARCHAR(160) NULL,
  ADD COLUMN `tagline` VARCHAR(300) NULL,
  ADD COLUMN `contact_line` VARCHAR(120) NULL,
  ADD COLUMN `facebook_url` VARCHAR(512) NULL,
  ADD COLUMN `map_url` VARCHAR(512) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(32) NULL,
  ADD COLUMN `bank_account_name` VARCHAR(200) NULL,
  ADD COLUMN `staff_daily_pin_hash` VARCHAR(255) NULL,
  ADD COLUMN `portal_banner_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_gallery_json` JSON NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS `dormitory_staff_links` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `token_hash` VARCHAR(128) NOT NULL,
  `token_cipher` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `dormitory_staff_link_owner_idx`(`owner_id`),
  UNIQUE INDEX `dormitory_staff_link_owner_trial_uniq`(`owner_id`, `trial_session_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dormitory_staff_links`
  ADD CONSTRAINT `dormitory_staff_links_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
