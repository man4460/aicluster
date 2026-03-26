-- Attendance: trial_session_id (idempotent — รองรับ DB ที่ apply ค้างครึ่งทาง)

-- --- attendance_settings ---
SET @db := DATABASE();

SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'attendance_settings' AND CONSTRAINT_NAME = 'attendance_settings_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @s := IF(@fk > 0, 'ALTER TABLE `attendance_settings` DROP FOREIGN KEY `attendance_settings_owner_id_fkey`', 'SELECT 1');
PREPARE _p FROM @s; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ix := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_settings' AND index_name = 'attendance_settings_owner_id_key');
SET @s2 := IF(@ix > 0, 'ALTER TABLE `attendance_settings` DROP INDEX `attendance_settings_owner_id_key`', 'SELECT 1');
PREPARE _p FROM @s2; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'attendance_settings' AND COLUMN_NAME = 'trial_session_id');
SET @s3 := IF(@col = 0, 'ALTER TABLE `attendance_settings` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT ''prod'' AFTER `owner_id`', 'SELECT 1');
PREPARE _p FROM @s3; EXECUTE _p; DEALLOCATE PREPARE _p;

UPDATE `attendance_settings` SET `trial_session_id` = 'prod' WHERE `trial_session_id` IS NULL OR `trial_session_id` = '';

SET @uix := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_settings' AND index_name = 'atset_owner_trial_uidx');
SET @s4 := IF(@uix = 0, 'CREATE UNIQUE INDEX `atset_owner_trial_uidx` ON `attendance_settings`(`owner_id`, `trial_session_id`)', 'SELECT 1');
PREPARE _p FROM @s4; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @oidx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_settings' AND index_name = 'atset_owner_id_idx');
SET @s5 := IF(@oidx = 0, 'CREATE INDEX `atset_owner_id_idx` ON `attendance_settings`(`owner_id`)', 'SELECT 1');
PREPARE _p FROM @s5; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @fk2 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'attendance_settings' AND CONSTRAINT_NAME = 'attendance_settings_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @s6 := IF(@fk2 = 0, 'ALTER TABLE `attendance_settings` ADD CONSTRAINT `attendance_settings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE _p FROM @s6; EXECUTE _p; DEALLOCATE PREPARE _p;

-- --- attendance_locations ---
SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'attendance_locations' AND CONSTRAINT_NAME = 'attendance_locations_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @t := IF(@fk > 0, 'ALTER TABLE `attendance_locations` DROP FOREIGN KEY `attendance_locations_owner_id_fkey`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ix := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_locations' AND index_name = 'attendance_locations_owner_id_sort_order_idx');
SET @t := IF(@ix > 0, 'ALTER TABLE `attendance_locations` DROP INDEX `attendance_locations_owner_id_sort_order_idx`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'attendance_locations' AND COLUMN_NAME = 'trial_session_id');
SET @t := IF(@col = 0, 'ALTER TABLE `attendance_locations` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT ''prod'' AFTER `owner_id`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

UPDATE `attendance_locations` SET `trial_session_id` = 'prod' WHERE `trial_session_id` IS NULL OR `trial_session_id` = '';

SET @ixn := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_locations' AND index_name = 'aloc_owner_trial_sort_idx');
SET @t := IF(@ixn = 0, 'CREATE INDEX `aloc_owner_trial_sort_idx` ON `attendance_locations`(`owner_id`, `trial_session_id`, `sort_order`)', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ixn2 := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_locations' AND index_name = 'aloc_owner_id_idx');
SET @t := IF(@ixn2 = 0, 'CREATE INDEX `aloc_owner_id_idx` ON `attendance_locations`(`owner_id`)', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @fk2 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'attendance_locations' AND CONSTRAINT_NAME = 'attendance_locations_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @t := IF(@fk2 = 0, 'ALTER TABLE `attendance_locations` ADD CONSTRAINT `attendance_locations_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

-- --- attendance_roster_entries ---
SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'attendance_roster_entries' AND CONSTRAINT_NAME = 'attendance_roster_entries_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @t := IF(@fk > 0, 'ALTER TABLE `attendance_roster_entries` DROP FOREIGN KEY `attendance_roster_entries_owner_id_fkey`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ix := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_roster_entries' AND index_name = 'attendance_roster_entries_owner_id_phone_key');
SET @t := IF(@ix > 0, 'ALTER TABLE `attendance_roster_entries` DROP INDEX `attendance_roster_entries_owner_id_phone_key`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ix := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_roster_entries' AND index_name = 'attendance_roster_entries_owner_id_is_active_idx');
SET @t := IF(@ix > 0, 'ALTER TABLE `attendance_roster_entries` DROP INDEX `attendance_roster_entries_owner_id_is_active_idx`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'attendance_roster_entries' AND COLUMN_NAME = 'trial_session_id');
SET @t := IF(@col = 0, 'ALTER TABLE `attendance_roster_entries` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT ''prod'' AFTER `owner_id`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

UPDATE `attendance_roster_entries` SET `trial_session_id` = 'prod' WHERE `trial_session_id` IS NULL OR `trial_session_id` = '';

SET @ixold := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_roster_entries' AND index_name = 'attendance_roster_entries_owner_id_phone_trial_session_id_key');
SET @t := IF(@ixold > 0, 'ALTER TABLE `attendance_roster_entries` DROP INDEX `attendance_roster_entries_owner_id_phone_trial_session_id_key`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ixn := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_roster_entries' AND index_name = 'atr_owner_phone_trial_uidx');
SET @t := IF(@ixn = 0, 'CREATE UNIQUE INDEX `atr_owner_phone_trial_uidx` ON `attendance_roster_entries`(`owner_id`, `phone`, `trial_session_id`)', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ixn2 := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_roster_entries' AND index_name = 'atr_owner_trial_active_idx');
SET @t := IF(@ixn2 = 0, 'CREATE INDEX `atr_owner_trial_active_idx` ON `attendance_roster_entries`(`owner_id`, `trial_session_id`, `is_active`)', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @fk2 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'attendance_roster_entries' AND CONSTRAINT_NAME = 'attendance_roster_entries_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @t := IF(@fk2 = 0, 'ALTER TABLE `attendance_roster_entries` ADD CONSTRAINT `attendance_roster_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

-- --- attendance_logs ---
SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'attendance_logs' AND CONSTRAINT_NAME = 'attendance_logs_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @t := IF(@fk > 0, 'ALTER TABLE `attendance_logs` DROP FOREIGN KEY `attendance_logs_owner_id_fkey`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ix := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_logs' AND index_name = 'attendance_logs_owner_id_check_in_time_idx');
SET @t := IF(@ix > 0, 'ALTER TABLE `attendance_logs` DROP INDEX `attendance_logs_owner_id_check_in_time_idx`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ix := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_logs' AND index_name = 'attendance_logs_owner_id_guest_phone_idx');
SET @t := IF(@ix > 0, 'ALTER TABLE `attendance_logs` DROP INDEX `attendance_logs_owner_id_guest_phone_idx`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'attendance_logs' AND COLUMN_NAME = 'trial_session_id');
SET @t := IF(@col = 0, 'ALTER TABLE `attendance_logs` ADD COLUMN `trial_session_id` VARCHAR(36) NOT NULL DEFAULT ''prod'' AFTER `owner_id`', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

UPDATE `attendance_logs` SET `trial_session_id` = 'prod' WHERE `trial_session_id` IS NULL OR `trial_session_id` = '';

SET @ixn := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_logs' AND index_name = 'alog_owner_trial_in_idx');
SET @t := IF(@ixn = 0, 'CREATE INDEX `alog_owner_trial_in_idx` ON `attendance_logs`(`owner_id`, `trial_session_id`, `check_in_time`)', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ixn2 := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_logs' AND index_name = 'alog_owner_trial_phone_idx');
SET @t := IF(@ixn2 = 0, 'CREATE INDEX `alog_owner_trial_phone_idx` ON `attendance_logs`(`owner_id`, `trial_session_id`, `guest_phone`)', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @ixn3 := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'attendance_logs' AND index_name = 'alog_owner_id_idx');
SET @t := IF(@ixn3 = 0, 'CREATE INDEX `alog_owner_id_idx` ON `attendance_logs`(`owner_id`)', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;

SET @fk2 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'attendance_logs' AND CONSTRAINT_NAME = 'attendance_logs_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @t := IF(@fk2 = 0, 'ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE _p FROM @t; EXECUTE _p; DEALLOCATE PREPARE _p;
