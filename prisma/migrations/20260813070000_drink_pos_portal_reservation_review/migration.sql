-- Drink POS: portal fields on shop profile + reservations + reviews (idempotent)

SET @db := DATABASE();

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'contact_line');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `contact_line` VARCHAR(120) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'facebook_url');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `facebook_url` VARCHAR(512) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'map_url');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `map_url` VARCHAR(512) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'portal_banner_url');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `portal_banner_url` VARCHAR(512) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'portal_gallery_json');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `portal_gallery_json` TEXT NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

UPDATE `drink_pos_shop_profiles` SET `portal_gallery_json` = '[]' WHERE `portal_gallery_json` IS NULL OR `portal_gallery_json` = '';

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'open_time');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `open_time` VARCHAR(5) NOT NULL DEFAULT ''08:00''', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'close_time');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `close_time` VARCHAR(5) NOT NULL DEFAULT ''20:00''', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'portal_booking_payment_mode');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `portal_booking_payment_mode` VARCHAR(16) NOT NULL DEFAULT ''NONE''', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'deposit_amount_baht');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `deposit_amount_baht` INT NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'drink_pos_shop_profiles' AND COLUMN_NAME = 'deposit_percent');
SET @sql := IF(@exist = 0, 'ALTER TABLE `drink_pos_shop_profiles` ADD COLUMN `deposit_percent` INT NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

CREATE TABLE IF NOT EXISTS `drink_pos_reservations` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `customer_name` VARCHAR(160) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `party_size` INT NOT NULL DEFAULT 2,
  `table_preference` VARCHAR(40) NOT NULL DEFAULT '',
  `visit_date_key` VARCHAR(10) NOT NULL,
  `visit_time_hm` VARCHAR(5) NOT NULL,
  `items_json` JSON NOT NULL,
  `items_total_baht` INT NOT NULL DEFAULT 0,
  `payment_mode` VARCHAR(16) NOT NULL DEFAULT 'NONE',
  `pay_due_baht` INT NOT NULL DEFAULT 0,
  `amount_paid_baht` INT NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(24) NOT NULL DEFAULT '',
  `payment_slip_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `status` VARCHAR(24) NOT NULL DEFAULT 'SCHEDULED',
  `note` VARCHAR(1000) NOT NULL DEFAULT '',
  `linked_sale_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `dp_rsv_owner_trial_date_idx`(`owner_user_id`, `trial_session_id`, `visit_date_key`),
  INDEX `dp_rsv_owner_trial_phone_idx`(`owner_user_id`, `trial_session_id`, `phone`),
  INDEX `dp_rsv_owner_trial_status_idx`(`owner_user_id`, `trial_session_id`, `status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `drink_pos_reviews` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `guest_name` VARCHAR(120) NOT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `comment` VARCHAR(800) NOT NULL,
  `photo_urls_json` TEXT NOT NULL,
  `is_published` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `dp_review_owner_pub_created_idx`(`owner_user_id`, `trial_session_id`, `is_published`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
