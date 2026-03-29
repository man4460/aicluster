ALTER TABLE `User`
  ADD COLUMN `last_attendance_token_date` DATE NULL,
  ADD COLUMN `employer_user_id` VARCHAR(191) NULL;

SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User' AND INDEX_NAME = 'User_employer_user_id_idx'
);
SET @sql_idx := IF(@idx = 0, 'CREATE INDEX `User_employer_user_id_idx` ON `User`(`employer_user_id`)', 'SELECT 1');
PREPARE i1 FROM @sql_idx; EXECUTE i1; DEALLOCATE PREPARE i1;

SET @fk_emp := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'User'
    AND CONSTRAINT_NAME = 'User_employer_user_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk := IF(@fk_emp = 0,
  'ALTER TABLE `User` ADD CONSTRAINT `User_employer_user_id_fkey` FOREIGN KEY (`employer_user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE f1 FROM @sql_fk; EXECUTE f1; DEALLOCATE PREPARE f1;

CREATE TABLE IF NOT EXISTS `attendance_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `shift_start_time` VARCHAR(5) NOT NULL DEFAULT '09:00',
    `shift_end_time` VARCHAR(5) NOT NULL DEFAULT '18:00',
    `allowed_location_lat` DOUBLE NOT NULL,
    `allowed_location_lng` DOUBLE NOT NULL,
    `radius_meters` INTEGER NOT NULL DEFAULT 120,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attendance_settings_owner_id_key`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_as_o := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance_settings'
    AND CONSTRAINT_NAME = 'attendance_settings_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_as_o := IF(@fk_as_o = 0,
  'ALTER TABLE `attendance_settings` ADD CONSTRAINT `attendance_settings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE aso FROM @sql_as_o; EXECUTE aso; DEALLOCATE PREPARE aso;

CREATE TABLE IF NOT EXISTS `attendance_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `actor_user_id` VARCHAR(191) NULL,
    `guest_phone` VARCHAR(20) NULL,
    `guest_name` VARCHAR(100) NULL,
    `check_in_time` DATETIME(3) NULL,
    `check_out_time` DATETIME(3) NULL,
    `check_in_lat` DOUBLE NULL,
    `check_in_lng` DOUBLE NULL,
    `check_out_lat` DOUBLE NULL,
    `check_out_lng` DOUBLE NULL,
    `status` ENUM('AWAITING_CHECKOUT', 'ON_TIME', 'LATE', 'EARLY_LEAVE', 'LATE_AND_EARLY') NOT NULL DEFAULT 'AWAITING_CHECKOUT',
    `late_check_in` BOOLEAN NOT NULL DEFAULT false,
    `early_check_out` BOOLEAN NOT NULL DEFAULT false,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attendance_logs_owner_id_check_in_time_idx`(`owner_id`, `check_in_time`),
    INDEX `attendance_logs_owner_id_guest_phone_idx`(`owner_id`, `guest_phone`),
    INDEX `attendance_logs_actor_user_id_idx`(`actor_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_al_o := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance_logs'
    AND CONSTRAINT_NAME = 'attendance_logs_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_al_o := IF(@fk_al_o = 0,
  'ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE alo FROM @sql_al_o; EXECUTE alo; DEALLOCATE PREPARE alo;

SET @fk_al_a := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance_logs'
    AND CONSTRAINT_NAME = 'attendance_logs_actor_user_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_al_a := IF(@fk_al_a = 0,
  'ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE ala FROM @sql_al_a; EXECUTE ala; DEALLOCATE PREPARE ala;
