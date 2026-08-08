-- Drink POS + Hotel Resort staff links (tokenized QR like building-pos)
CREATE TABLE IF NOT EXISTS `drink_pos_staff_links` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `token_hash` VARCHAR(128) NOT NULL,
  `token_cipher` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `drink_pos_staff_link_owner_trial_uniq`(`owner_id`, `trial_session_id`),
  INDEX `drink_pos_staff_link_owner_idx`(`owner_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hotel_resort_staff_links` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `token_hash` VARCHAR(128) NOT NULL,
  `token_cipher` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `hotel_resort_staff_link_owner_trial_uniq`(`owner_id`, `trial_session_id`),
  INDEX `hotel_resort_staff_link_owner_idx`(`owner_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `drink_pos_staff_links`
  ADD CONSTRAINT `drink_pos_staff_links_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `hotel_resort_staff_links`
  ADD CONSTRAINT `hotel_resort_staff_links_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
