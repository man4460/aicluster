-- Car wash: appointment booking + day schedule (mirror massage module)

CREATE TABLE `car_wash_shop_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `default_slot_minutes` INTEGER NOT NULL DEFAULT 30,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `car_wash_shop_profiles_owner_id_trial_session_id_key`(`owner_id`, `trial_session_id`),
    INDEX `car_wash_shop_profiles_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `car_wash_day_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `schedule_date` DATE NOT NULL,
    `open_time` VARCHAR(5) NOT NULL,
    `close_time` VARCHAR(5) NOT NULL,
    `slot_minutes` INTEGER NOT NULL DEFAULT 30,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `car_wash_day_sched_owner_trial_date_uq`(`owner_id`, `trial_session_id`, `schedule_date`),
    INDEX `car_wash_day_schedules_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `car_wash_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `phone` VARCHAR(32) NOT NULL,
    `plate_number` VARCHAR(64) NOT NULL DEFAULT '',
    `customer_name` VARCHAR(160) NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 30,
    `status` ENUM('SCHEDULED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `car_wash_bookings_owner_id_scheduled_at_idx`(`owner_id`, `scheduled_at`),
    INDEX `car_wash_bookings_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `car_wash_shop_profiles` ADD CONSTRAINT `car_wash_shop_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `car_wash_day_schedules` ADD CONSTRAINT `car_wash_day_schedules_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `car_wash_bookings` ADD CONSTRAINT `car_wash_bookings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
