-- CreateTable
CREATE TABLE `attendance_locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL DEFAULT 'จุดเช็ค',
    `allowed_location_lat` DOUBLE NOT NULL,
    `allowed_location_lng` DOUBLE NOT NULL,
    `radius_meters` INTEGER NOT NULL DEFAULT 120,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attendance_locations_owner_id_sort_order_idx`(`owner_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_shifts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `location_id` INTEGER NOT NULL,
    `start_time` VARCHAR(5) NOT NULL,
    `end_time` VARCHAR(5) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attendance_shifts_location_id_sort_order_idx`(`location_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendance_locations` ADD CONSTRAINT `attendance_locations_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_shifts` ADD CONSTRAINT `attendance_shifts_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `attendance_locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill จาก attendance_settings (หนึ่งแถวต่อเจ้าของ)
INSERT INTO `attendance_locations` (`owner_id`, `name`, `allowed_location_lat`, `allowed_location_lng`, `radius_meters`, `sort_order`, `created_at`, `updated_at`)
SELECT `owner_id`, 'จุดหลัก', `allowed_location_lat`, `allowed_location_lng`, `radius_meters`, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `attendance_settings`;

INSERT INTO `attendance_shifts` (`location_id`, `start_time`, `end_time`, `sort_order`, `created_at`, `updated_at`)
SELECT `l`.`id`, `s`.`shift_start_time`, `s`.`shift_end_time`, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `attendance_settings` `s`
INNER JOIN `attendance_locations` `l` ON `l`.`owner_id` = `s`.`owner_id`;
