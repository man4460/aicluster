-- AlterTable
ALTER TABLE `attendance_settings` ADD COLUMN `face_check_in_enabled` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `attendance_roster_entries` ADD COLUMN `face_descriptor_json` LONGTEXT NULL,
    ADD COLUMN `face_enrolled_at` DATETIME(3) NULL;
