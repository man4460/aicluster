-- Trial sandbox: ตาราง session + คอลัมน์ trial_session_id (prod = ข้อมูลจริง)

CREATE TABLE IF NOT EXISTS `trial_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `module_id` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `trial_sessions_user_id_module_id_idx`(`user_id`, `module_id`),
    INDEX `trial_sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_ts_user := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'trial_sessions'
    AND CONSTRAINT_NAME = 'trial_sessions_user_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @add_ts_user := IF(@fk_ts_user = 0,
  'ALTER TABLE `trial_sessions` ADD CONSTRAINT `trial_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE s1 FROM @add_ts_user; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @fk_ts_mod := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'trial_sessions'
    AND CONSTRAINT_NAME = 'trial_sessions_module_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @add_ts_mod := IF(@fk_ts_mod = 0,
  'ALTER TABLE `trial_sessions` ADD CONSTRAINT `trial_sessions_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `module_list`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE s2 FROM @add_ts_mod; EXECUTE s2; DEALLOCATE PREPARE s2;

-- dormitory_profiles (MySQL: unique index on owner_id backs FK to User — drop FK before dropping that index)
ALTER TABLE `dormitory_profiles` DROP FOREIGN KEY `dormitory_profiles_owner_id_fkey`;
ALTER TABLE `dormitory_profiles` DROP INDEX `dormitory_profiles_owner_id_key`;
ALTER TABLE `dormitory_profiles` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `dormitory_profiles` SET `trial_session_id` = 'prod' WHERE `trial_session_id` IS NULL OR `trial_session_id` = '';
CREATE UNIQUE INDEX `dormitory_profiles_owner_id_trial_session_id_key` ON `dormitory_profiles`(`owner_id`, `trial_session_id`);
CREATE INDEX `dormitory_profiles_owner_id_idx` ON `dormitory_profiles`(`owner_id`);
ALTER TABLE `dormitory_profiles` ADD CONSTRAINT `dormitory_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- barber_shop_profiles (same pattern as dormitory_profiles)
ALTER TABLE `barber_shop_profiles` DROP FOREIGN KEY `barber_shop_profiles_owner_id_fkey`;
ALTER TABLE `barber_shop_profiles` DROP INDEX `barber_shop_profiles_owner_id_key`;
ALTER TABLE `barber_shop_profiles` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `barber_shop_profiles` SET `trial_session_id` = 'prod';
CREATE UNIQUE INDEX `barber_shop_profiles_owner_id_trial_session_id_key` ON `barber_shop_profiles`(`owner_id`, `trial_session_id`);
CREATE INDEX `barber_shop_profiles_owner_id_idx` ON `barber_shop_profiles`(`owner_id`);
ALTER TABLE `barber_shop_profiles` ADD CONSTRAINT `barber_shop_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- rooms
ALTER TABLE `rooms` DROP INDEX `rooms_owner_id_room_number_key`;
ALTER TABLE `rooms` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `rooms` SET `trial_session_id` = 'prod';
CREATE UNIQUE INDEX `rooms_owner_id_room_number_trial_session_id_key` ON `rooms`(`owner_id`, `room_number`, `trial_session_id`);

-- barber_packages
ALTER TABLE `barber_packages` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `barber_packages` SET `trial_session_id` = 'prod';
CREATE INDEX `barber_packages_owner_id_trial_session_id_idx` ON `barber_packages`(`owner_id`, `trial_session_id`);

-- barber_customers
ALTER TABLE `barber_customers` DROP INDEX `barber_customers_owner_id_phone_key`;
ALTER TABLE `barber_customers` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `barber_customers` SET `trial_session_id` = 'prod';
CREATE UNIQUE INDEX `barber_customers_owner_id_phone_trial_session_id_key` ON `barber_customers`(`owner_id`, `phone`, `trial_session_id`);

-- barber_bookings
ALTER TABLE `barber_bookings` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `barber_bookings` SET `trial_session_id` = 'prod';
CREATE INDEX `barber_bookings_owner_id_trial_session_id_idx` ON `barber_bookings`(`owner_id`, `trial_session_id`);

-- customer_subscriptions
ALTER TABLE `customer_subscriptions` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `customer_subscriptions` SET `trial_session_id` = 'prod';
CREATE INDEX `customer_subscriptions_owner_id_trial_session_id_idx` ON `customer_subscriptions`(`owner_id`, `trial_session_id`);

-- barber_service_logs
ALTER TABLE `barber_service_logs` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `barber_service_logs` SET `trial_session_id` = 'prod';
CREATE INDEX `barber_service_logs_owner_id_trial_session_id_idx` ON `barber_service_logs`(`owner_id`, `trial_session_id`);

-- barber_stylists
ALTER TABLE `barber_stylists` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `barber_stylists` SET `trial_session_id` = 'prod';
CREATE INDEX `barber_stylists_owner_id_trial_session_id_idx` ON `barber_stylists`(`owner_id`, `trial_session_id`);

-- barber_portal_staff_pings
ALTER TABLE `barber_portal_staff_pings` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod' AFTER `owner_id`;
UPDATE `barber_portal_staff_pings` SET `trial_session_id` = 'prod';
