-- โรงแรม / รีสอร์ท

CREATE TABLE `hotel_resort_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `property_name` VARCHAR(160) NOT NULL DEFAULT 'โรงแรม',
    `check_in_time` VARCHAR(8) NOT NULL DEFAULT '14:00',
    `check_out_time` VARCHAR(8) NOT NULL DEFAULT '12:00',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hr_profile_owner_trial_uq`(`owner_user_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `hotel_resort_room_types` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `base_price_baht` INTEGER NOT NULL DEFAULT 0,
    `max_guests` INTEGER NOT NULL DEFAULT 2,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hr_rtype_owner_sort_idx`(`owner_user_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `hotel_resort_rooms` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `room_type_id` VARCHAR(191) NOT NULL,
    `room_number` VARCHAR(20) NOT NULL,
    `floor` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE') NOT NULL DEFAULT 'VACANT',
    `note` VARCHAR(300) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hr_room_owner_number_uq`(`owner_user_id`, `room_number`),
    INDEX `hr_room_owner_status_idx`(`owner_user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `hotel_resort_guests` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `full_name` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `national_id` VARCHAR(30) NULL,
    `nationality` VARCHAR(80) NULL,
    `id_card_image_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hr_guest_owner_trial_phone_idx`(`owner_user_id`, `trial_session_id`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `hotel_resort_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `guest_id` VARCHAR(191) NULL,
    `room_id` VARCHAR(191) NULL,
    `room_type_id` VARCHAR(191) NULL,
    `guest_name` VARCHAR(160) NOT NULL,
    `guest_phone` VARCHAR(20) NOT NULL,
    `check_in_at` DATETIME(3) NOT NULL,
    `check_out_at` DATETIME(3) NOT NULL,
    `status` ENUM('RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW', 'CANCELLED') NOT NULL DEFAULT 'RESERVED',
    `is_walk_in` BOOLEAN NOT NULL DEFAULT false,
    `total_baht` INTEGER NOT NULL DEFAULT 0,
    `amount_paid_baht` INTEGER NOT NULL DEFAULT 0,
    `payment_status` ENUM('UNPAID', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'UNPAID',
    `id_card_image_url` VARCHAR(500) NULL,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hr_book_owner_status_in_idx`(`owner_user_id`, `status`, `check_in_at`),
    INDEX `hr_book_owner_phone_idx`(`owner_user_id`, `guest_phone`),
    INDEX `hr_book_room_idx`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `hotel_resort_cost_entries` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(160) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `spent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(300) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `hr_cost_owner_spent_idx`(`owner_user_id`, `spent_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `module_list` (`id`, `slug`, `title`, `description`, `group_id`, `sort_order`, `is_active`, `created_at`, `updated_at`)
SELECT UUID(), 'hotel-resort', 'โรงแรม / รีสอร์ท', 'กลุ่ม 1 (Basic) — ห้องพัก จอง เช็คอิน บิล QR · 1 บาท/วัน', 1, 31, true, NOW(3), NOW(3)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `module_list` WHERE `slug` = 'hotel-resort');
