-- AlterEnum
ALTER TABLE `parking_sites` MODIFY COLUMN `pricing_mode` ENUM('HOURLY', 'DAILY', 'MONTHLY') NOT NULL DEFAULT 'HOURLY';
ALTER TABLE `parking_sessions` MODIFY COLUMN `pricing_mode` ENUM('HOURLY', 'DAILY', 'MONTHLY') NOT NULL;

-- AlterTable ParkingSite
ALTER TABLE `parking_sites` ADD COLUMN `monthly_rate_baht` DECIMAL(10, 2) NULL;
ALTER TABLE `parking_sites` ADD COLUMN `note` VARCHAR(500) NOT NULL DEFAULT '';
ALTER TABLE `parking_sites` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX `parking_site_owner_trial_idx` ON `parking_sites`(`owner_user_id`, `trial_session_id`);

-- AlterTable ParkingSession
ALTER TABLE `parking_sessions` ADD COLUMN `monthly_rate_snap` DECIMAL(10, 2) NULL;
ALTER TABLE `parking_sessions` ADD COLUMN `package_id` INTEGER NULL;
ALTER TABLE `parking_sessions` ADD COLUMN `package_name` VARCHAR(160) NULL;
ALTER TABLE `parking_sessions` ADD COLUMN `membership_id` INTEGER NULL;
ALTER TABLE `parking_sessions` ADD COLUMN `booking_id` INTEGER NULL;

-- CreateTable ParkingPackage
CREATE TABLE `parking_packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(160) NOT NULL,
    `price` INTEGER NOT NULL,
    `stay_mode` ENUM('HOURLY', 'DAILY', 'MONTHLY') NOT NULL DEFAULT 'DAILY',
    `stay_units` INTEGER NOT NULL DEFAULT 1,
    `total_uses` INTEGER NOT NULL DEFAULT 1,
    `description` VARCHAR(800) NOT NULL DEFAULT '',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `parking_pkg_owner_trial_active_idx`(`owner_user_id`, `trial_session_id`, `is_active`),
    INDEX `parking_pkg_owner_idx`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ParkingMembership
CREATE TABLE `parking_memberships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `customer_name` VARCHAR(160) NOT NULL,
    `customer_phone` VARCHAR(32) NOT NULL DEFAULT '',
    `license_plate` VARCHAR(24) NOT NULL,
    `package_id` INTEGER NOT NULL,
    `package_name` VARCHAR(160) NOT NULL,
    `paid_amount` INTEGER NOT NULL DEFAULT 0,
    `total_uses` INTEGER NOT NULL DEFAULT 0,
    `used_uses` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `slip_photo_url` VARCHAR(512) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `parking_mbr_owner_trial_active_idx`(`owner_user_id`, `trial_session_id`, `is_active`),
    INDEX `parking_mbr_owner_trial_phone_idx`(`owner_user_id`, `trial_session_id`, `customer_phone`),
    INDEX `parking_mbr_owner_trial_plate_idx`(`owner_user_id`, `trial_session_id`, `license_plate`),
    INDEX `parking_mbr_owner_idx`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ParkingBooking
CREATE TABLE `parking_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `site_id` INTEGER NOT NULL,
    `spot_id` INTEGER NULL,
    `license_plate` VARCHAR(24) NOT NULL,
    `customer_name` VARCHAR(100) NULL,
    `customer_phone` VARCHAR(32) NULL,
    `package_id` INTEGER NULL,
    `package_name` VARCHAR(160) NOT NULL DEFAULT '',
    `scheduled_start` DATETIME(3) NOT NULL,
    `scheduled_end` DATETIME(3) NULL,
    `pricing_mode` ENUM('HOURLY', 'DAILY', 'MONTHLY') NOT NULL DEFAULT 'HOURLY',
    `amount_baht` INTEGER NOT NULL DEFAULT 0,
    `amount_paid_baht` INTEGER NOT NULL DEFAULT 0,
    `payment_status` VARCHAR(24) NOT NULL DEFAULT 'UNPAID',
    `status` ENUM('SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `parking_book_owner_start_idx`(`owner_user_id`, `scheduled_start`),
    INDEX `parking_book_owner_trial_idx`(`owner_user_id`, `trial_session_id`),
    INDEX `parking_book_site_idx`(`site_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey (table is `User`, not `users`)
ALTER TABLE `parking_packages` ADD CONSTRAINT `parking_packages_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `parking_memberships` ADD CONSTRAINT `parking_memberships_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `parking_bookings` ADD CONSTRAINT `parking_bookings_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `parking_bookings` ADD CONSTRAINT `parking_bookings_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `parking_sites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `parking_sessions` ADD CONSTRAINT `parking_sessions_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `parking_memberships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `parking_sessions` ADD CONSTRAINT `parking_sessions_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `parking_bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX `parking_sessions_booking_id_key` ON `parking_sessions`(`booking_id`);
CREATE INDEX `parking_sess_membership_idx` ON `parking_sessions`(`membership_id`);
