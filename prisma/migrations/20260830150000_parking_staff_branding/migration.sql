-- Parking site branding + staff daily PIN + permanent staff links
-- (canonical SQL; applied via repair if needed — FK targets `User`)

ALTER TABLE `parking_sites`
  ADD COLUMN `logo_url` VARCHAR(512) NULL,
  ADD COLUMN `contact_phone` VARCHAR(32) NULL,
  ADD COLUMN `tagline` VARCHAR(300) NULL,
  ADD COLUMN `address` VARCHAR(500) NULL,
  ADD COLUMN `line_id` VARCHAR(120) NULL,
  ADD COLUMN `facebook_url` VARCHAR(512) NULL,
  ADD COLUMN `map_url` VARCHAR(512) NULL,
  ADD COLUMN `staff_daily_pin_hash` VARCHAR(255) NULL;

CREATE TABLE `parking_staff_links` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `token_hash` VARCHAR(128) NOT NULL,
  `token_cipher` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `parking_staff_link_owner_trial_uniq`(`owner_id`, `trial_session_id`),
  INDEX `parking_staff_link_owner_idx`(`owner_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `parking_staff_links_owner_id_fkey`
    FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
