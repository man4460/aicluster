-- รายชื่อพนักงาน (เบอร์) สำหรับเช็คผ่าน QR + แยกประเภทผู้เช็คสาธารณะ

CREATE TABLE IF NOT EXISTS `attendance_roster_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attendance_roster_entries_owner_id_phone_key`(`owner_id`, `phone`),
    INDEX `attendance_roster_entries_owner_id_is_active_idx`(`owner_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_roster := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance_roster_entries'
    AND CONSTRAINT_NAME = 'attendance_roster_entries_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_roster := IF(@fk_roster = 0,
  'ALTER TABLE `attendance_roster_entries` ADD CONSTRAINT `attendance_roster_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE rfk FROM @sql_roster; EXECUTE rfk; DEALLOCATE PREPARE rfk;

SET @col_pv := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance_logs' AND COLUMN_NAME = 'public_visitor_kind'
);
SET @sql_pv := IF(@col_pv = 0,
  'ALTER TABLE `attendance_logs` ADD COLUMN `public_visitor_kind` ENUM(''ROSTER_STAFF'', ''EXTERNAL_GUEST'') NULL',
  'SELECT 1');
PREPARE pv FROM @sql_pv; EXECUTE pv; DEALLOCATE PREPARE pv;
