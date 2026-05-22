-- CreateTable
CREATE TABLE `loyalty_stamp_shop_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `display_name` VARCHAR(200) NULL,
    `tagline` VARCHAR(300) NULL,
    `logo_url` VARCHAR(512) NULL,
    `public_card_enabled` BOOLEAN NOT NULL DEFAULT true,
    `stamps_per_reward` INTEGER NOT NULL DEFAULT 10,
    `reward_title` VARCHAR(160) NOT NULL DEFAULT 'ของรางวัล',
    `reward_description` VARCHAR(500) NULL,
    `stamp_emoji` VARCHAR(8) NOT NULL DEFAULT '⭐',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loyalty_stamp_shop_profiles_owner_id_trial_session_id_key`(`owner_id`, `trial_session_id`),
    INDEX `loyalty_stamp_shop_profiles_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `loyalty_stamp_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` INTEGER NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `customer_name` VARCHAR(120) NULL,
    `current_stamps` INTEGER NOT NULL DEFAULT 0,
    `qr_token` VARCHAR(64) NOT NULL,
    `total_redemptions` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loyalty_stamp_members_qr_token_key`(`qr_token`),
    UNIQUE INDEX `ls_member_owner_trial_phone_uq`(`owner_id`, `trial_session_id`, `phone`),
    INDEX `ls_member_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `loyalty_stamp_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `member_id` INTEGER NOT NULL,
    `event_type` ENUM('STAMP_ADD', 'REDEEM') NOT NULL,
    `stamps_delta` INTEGER NOT NULL,
    `balance_after` INTEGER NOT NULL,
    `note` VARCHAR(200) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ls_event_member_created_idx`(`member_id`, `created_at`),
    INDEX `ls_event_owner_trial_idx`(`owner_id`, `trial_session_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `loyalty_stamp_shop_profiles` ADD CONSTRAINT `loyalty_stamp_shop_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `loyalty_stamp_members` ADD CONSTRAINT `loyalty_stamp_members_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `loyalty_stamp_members` ADD CONSTRAINT `loyalty_stamp_members_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `loyalty_stamp_shop_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `loyalty_stamp_events` ADD CONSTRAINT `loyalty_stamp_events_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `loyalty_stamp_events` ADD CONSTRAINT `loyalty_stamp_events_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `loyalty_stamp_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `module_list` (`id`, `slug`, `title`, `description`, `group_id`, `sort_order`, `is_active`, `created_at`, `updated_at`)
SELECT 'loyalty-stamp-mod', 'loyalty-stamp', 'สะสมแต้มดิจิทัล', 'กลุ่ม 1 (Basic) — บัตรสมาชิกสะสมแต้ม ร้านกาแฟ/อาหาร ใช้ฟรี', 1, 29, TRUE, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `module_list` WHERE `slug` = 'loyalty-stamp');
