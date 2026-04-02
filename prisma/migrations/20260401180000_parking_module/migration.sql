-- CreateTable
CREATE TABLE `parking_sites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `pricing_mode` ENUM('HOURLY', 'DAILY') NOT NULL DEFAULT 'HOURLY',
    `hourly_rate_baht` DECIMAL(10, 2) NULL,
    `daily_rate_baht` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `parking_site_owner_name_trial_uniq`(`owner_user_id`, `name`, `trial_session_id`),
    INDEX `parking_site_owner_idx`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parking_spots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `site_id` INTEGER NOT NULL,
    `spot_code` VARCHAR(24) NOT NULL,
    `zone_label` VARCHAR(80) NULL,
    `sort_floor` INTEGER NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `check_in_token` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `parking_spots_check_in_token_key`(`check_in_token`),
    UNIQUE INDEX `parking_spot_site_code_uniq`(`site_id`, `spot_code`),
    INDEX `parking_spot_site_idx`(`site_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parking_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spot_id` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `check_in_at` DATETIME(3) NOT NULL,
    `check_out_at` DATETIME(3) NULL,
    `license_plate` VARCHAR(24) NOT NULL,
    `customer_name` VARCHAR(100) NULL,
    `customer_phone` VARCHAR(32) NULL,
    `self_check_in` BOOLEAN NOT NULL DEFAULT false,
    `pricing_mode` ENUM('HOURLY', 'DAILY') NOT NULL,
    `hourly_rate_snap` DECIMAL(10, 2) NULL,
    `daily_rate_snap` DECIMAL(10, 2) NULL,
    `billed_units` INTEGER NULL,
    `amount_due_baht` DECIMAL(10, 2) NULL,
    `amount_paid_baht` DECIMAL(10, 2) NULL,
    `internal_note` TEXT NULL,
    `shuttle_from` VARCHAR(255) NULL,
    `shuttle_to` VARCHAR(255) NULL,
    `shuttle_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `parking_sess_spot_status_idx`(`spot_id`, `status`),
    INDEX `parking_sess_checkin_idx`(`check_in_at`),
    INDEX `parking_sess_plate_idx`(`license_plate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `parking_sites` ADD CONSTRAINT `parking_sites_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parking_spots` ADD CONSTRAINT `parking_spots_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `parking_sites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parking_sessions` ADD CONSTRAINT `parking_sessions_spot_id_fkey` FOREIGN KEY (`spot_id`) REFERENCES `parking_spots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
