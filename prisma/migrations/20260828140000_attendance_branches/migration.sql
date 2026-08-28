-- สาขา (branch) + ผูกจุดเช็คและสาขาประจำพนักงาน

CREATE TABLE `attendance_branches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(80) NOT NULL DEFAULT 'สาขาหลัก',
    `code` VARCHAR(20) NOT NULL DEFAULT 'MAIN',
    `address` VARCHAR(200) NOT NULL DEFAULT '',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `albr_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
    INDEX `albr_owner_id_idx`(`owner_id`),
    UNIQUE INDEX `albr_owner_trial_code_uidx`(`owner_id`, `trial_session_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `attendance_locations` ADD COLUMN `branch_id` INTEGER NULL;

ALTER TABLE `attendance_roster_entries` ADD COLUMN `home_branch_id` INTEGER NULL;

-- สร้างสาขาหลักต่อ owner+scope ที่มีจุดเช็คอยู่แล้ว
INSERT INTO `attendance_branches` (`owner_id`, `trial_session_id`, `name`, `code`, `address`, `is_active`, `sort_order`, `updated_at`)
SELECT DISTINCT `owner_id`, `trial_session_id`, 'สาขาหลัก', 'MAIN', '', true, 0, CURRENT_TIMESTAMP(3)
FROM `attendance_locations`;

UPDATE `attendance_locations` AS al
INNER JOIN `attendance_branches` AS ab
  ON al.`owner_id` = ab.`owner_id`
 AND al.`trial_session_id` = ab.`trial_session_id`
 AND ab.`code` = 'MAIN'
SET al.`branch_id` = ab.`id`
WHERE al.`branch_id` IS NULL;

-- owner ที่ยังไม่มีจุดเช็ค — สร้างสาขาหลักจาก settings (ถ้ามี)
INSERT INTO `attendance_branches` (`owner_id`, `trial_session_id`, `name`, `code`, `address`, `is_active`, `sort_order`, `updated_at`)
SELECT s.`owner_id`, s.`trial_session_id`, 'สาขาหลัก', 'MAIN', '', true, 0, CURRENT_TIMESTAMP(3)
FROM `attendance_settings` AS s
WHERE NOT EXISTS (
  SELECT 1 FROM `attendance_branches` AS b
  WHERE b.`owner_id` = s.`owner_id` AND b.`trial_session_id` = s.`trial_session_id`
);

ALTER TABLE `attendance_locations` MODIFY `branch_id` INTEGER NOT NULL;

ALTER TABLE `attendance_locations` ADD CONSTRAINT `attendance_locations_branch_id_fkey`
  FOREIGN KEY (`branch_id`) REFERENCES `attendance_branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `attendance_roster_entries` ADD CONSTRAINT `attendance_roster_entries_home_branch_id_fkey`
  FOREIGN KEY (`home_branch_id`) REFERENCES `attendance_branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `aloc_branch_id_idx` ON `attendance_locations`(`branch_id`);
CREATE INDEX `arost_home_branch_idx` ON `attendance_roster_entries`(`home_branch_id`);

ALTER TABLE `attendance_branches` ADD CONSTRAINT `attendance_branches_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
