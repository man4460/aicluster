-- ระบบจัดการหมู่บ้าน (กลุ่ม 1)
ALTER TABLE `User` ADD COLUMN `last_village_token_date` DATE NULL;

CREATE TABLE `village_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `display_name` VARCHAR(200) NULL,
    `address` TEXT NULL,
    `contact_phone` VARCHAR(32) NULL,
    `prompt_pay_phone` VARCHAR(20) NULL,
    `payment_channels_note` TEXT NULL,
    `default_monthly_fee` INTEGER NOT NULL DEFAULT 0,
    `due_day_of_month` INTEGER NOT NULL DEFAULT 5,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vprof_owner_trial_uniq`(`owner_id`, `trial_session_id`),
    INDEX `vprof_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `village_houses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `house_no` VARCHAR(40) NOT NULL,
    `plot_label` VARCHAR(80) NULL,
    `owner_name` VARCHAR(200) NULL,
    `phone` VARCHAR(32) NULL,
    `monthly_fee_override` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vhouse_owner_trial_no_uniq`(`owner_id`, `trial_session_id`, `house_no`),
    INDEX `vhouse_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
    INDEX `vhouse_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `village_residents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `house_id` INTEGER NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `note` VARCHAR(200) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vres_house_idx`(`house_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `village_common_fee_rows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `house_id` INTEGER NOT NULL,
    `year_month` VARCHAR(7) NOT NULL,
    `amount_due` INTEGER NOT NULL,
    `amount_paid` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'PARTIAL', 'PAID', 'WAIVED') NOT NULL DEFAULT 'PENDING',
    `note` VARCHAR(500) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vfee_owner_trial_house_ym_uniq`(`owner_id`, `trial_session_id`, `house_id`, `year_month`),
    INDEX `vfee_owner_trial_ym_idx`(`owner_id`, `trial_session_id`, `year_month`),
    INDEX `vfee_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `village_slip_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `house_id` INTEGER NOT NULL,
    `fee_row_id` INTEGER NULL,
    `year_month` VARCHAR(7) NOT NULL,
    `amount` INTEGER NOT NULL,
    `slip_image_url` VARCHAR(512) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewer_note` VARCHAR(500) NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_at` DATETIME(3) NULL,

    INDEX `vslip_owner_trial_status_idx`(`owner_id`, `trial_session_id`, `status`),
    INDEX `vslip_owner_trial_ym_idx`(`owner_id`, `trial_session_id`, `year_month`),
    INDEX `vslip_fee_row_idx`(`fee_row_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `village_profiles` ADD CONSTRAINT `village_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `village_houses` ADD CONSTRAINT `village_houses_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `village_residents` ADD CONSTRAINT `village_residents_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `village_houses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `village_common_fee_rows` ADD CONSTRAINT `village_common_fee_rows_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `village_common_fee_rows` ADD CONSTRAINT `village_common_fee_rows_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `village_houses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `village_slip_submissions` ADD CONSTRAINT `village_slip_submissions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `village_slip_submissions` ADD CONSTRAINT `village_slip_submissions_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `village_houses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `village_slip_submissions` ADD CONSTRAINT `village_slip_submissions_fee_row_id_fkey` FOREIGN KEY (`fee_row_id`) REFERENCES `village_common_fee_rows`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `module_list` (
  `id`,
  `slug`,
  `title`,
  `description`,
  `group_id`,
  `sort_order`,
  `is_active`,
  `created_at`,
  `updated_at`
)
SELECT
  'village-module',
  'village',
  'ระบบจัดการหมู่บ้าน',
  'กลุ่ม 1 (Basic) — ลูกบ้าน ค่าส่วนกลางรายบ้าน ตรวจสลิป สรุปรายปี รายงาน Excel',
  1,
  19,
  TRUE,
  NOW(3),
  NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `module_list` WHERE `slug` = 'village');
