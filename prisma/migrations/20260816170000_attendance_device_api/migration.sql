-- AlterTable
ALTER TABLE `attendance_settings`
  ADD COLUMN `device_api_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `device_api_key_hash` VARCHAR(255) NULL,
  ADD COLUMN `device_api_key_hint` VARCHAR(16) NULL;

-- AlterTable
ALTER TABLE `attendance_roster_entries`
  ADD COLUMN `fingerprint_slot` INTEGER NULL,
  ADD COLUMN `fingerprint_enrolled_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `arost_owner_trial_fp_idx` ON `attendance_roster_entries`(`owner_id`, `trial_session_id`, `fingerprint_slot`);
