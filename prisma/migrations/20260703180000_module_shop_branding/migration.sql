-- Module shop branding (per-module display name + logo for QR)
CREATE TABLE `module_shop_brandings` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `module_slug` VARCHAR(64) NOT NULL,
  `display_name` VARCHAR(200) NULL,
  `logo_url` VARCHAR(512) NULL,
  `tagline` VARCHAR(300) NULL,
  `contact_phone` VARCHAR(32) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `msb_owner_trial_slug_uq`(`owner_user_id`, `trial_session_id`, `module_slug`),
  INDEX `msb_owner_slug_idx`(`owner_user_id`, `module_slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Hotel resort — logo + contact for QR
ALTER TABLE `hotel_resort_profiles`
  ADD COLUMN `logo_url` VARCHAR(512) NULL,
  ADD COLUMN `tagline` VARCHAR(300) NULL,
  ADD COLUMN `contact_phone` VARCHAR(32) NULL;

-- Drink POS — shop display for portal + QR
ALTER TABLE `drink_pos_shop_profiles`
  ADD COLUMN `display_name` VARCHAR(200) NULL,
  ADD COLUMN `logo_url` VARCHAR(512) NULL,
  ADD COLUMN `tagline` VARCHAR(300) NULL,
  ADD COLUMN `contact_phone` VARCHAR(32) NULL;
