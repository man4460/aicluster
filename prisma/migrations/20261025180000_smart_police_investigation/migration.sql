-- Smart Police: ชุดสืบสวน + เส้นเชื่อมกราฟ (link analysis แบบ i2)

CREATE TABLE `smart_police_suspects` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `full_name` VARCHAR(200) NOT NULL,
  `alias` VARCHAR(200) NULL,
  `nickname` VARCHAR(120) NULL,
  `national_id` VARCHAR(32) NULL,
  `birth_date` DATETIME(3) NULL,
  `gender` VARCHAR(16) NULL,
  `photo_url` VARCHAR(512) NULL,
  `phone` VARCHAR(32) NULL,
  `occupation` VARCHAR(200) NULL,
  `description` TEXT NULL,
  `risk_level` VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
  `status` VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `spsuspect_owner_status_idx`(`owner_user_id`, `status`),
  INDEX `spsuspect_owner_name_idx`(`owner_user_id`, `full_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_police_suspect_addresses` (
  `id` VARCHAR(191) NOT NULL,
  `suspect_id` VARCHAR(191) NOT NULL,
  `kind` VARCHAR(16) NOT NULL DEFAULT 'HOME',
  `label` VARCHAR(200) NULL,
  `address` TEXT NOT NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `accuracy_m` INTEGER NULL,
  `source` VARCHAR(120) NULL,
  `verified_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `spaddr_suspect_idx`(`suspect_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_police_investigation_logs` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `case_id` VARCHAR(191) NULL,
  `suspect_id` VARCHAR(191) NULL,
  `occurred_at` DATETIME(3) NOT NULL,
  `place` TEXT NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `officer_name` VARCHAR(200) NULL,
  `activity` VARCHAR(20) NOT NULL DEFAULT 'SUMMARY',
  `result` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `splog_owner_time_idx`(`owner_user_id`, `occurred_at`),
  INDEX `splog_case_idx`(`case_id`),
  INDEX `splog_suspect_idx`(`suspect_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_police_investigation_reports` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `case_id` VARCHAR(191) NULL,
  `title` VARCHAR(255) NOT NULL,
  `report_no` VARCHAR(64) NULL,
  `reported_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `officer_name` VARCHAR(200) NULL,
  `summary` TEXT NULL,
  `body` MEDIUMTEXT NOT NULL,
  `finding` TEXT NULL,
  `attachment_url` VARCHAR(512) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `spreport_owner_time_idx`(`owner_user_id`, `reported_at`),
  INDEX `spreport_case_idx`(`case_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_police_links` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `from_id` VARCHAR(191) NOT NULL,
  `to_id` VARCHAR(191) NOT NULL,
  `kind` VARCHAR(20) NOT NULL DEFAULT 'KNOWN',
  `label` VARCHAR(200) NULL,
  `directed` BOOLEAN NOT NULL DEFAULT false,
  `weight` INTEGER NOT NULL DEFAULT 1,
  `strength` INTEGER NOT NULL DEFAULT 1,
  `case_id` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `splink_owner_pair_kind_uidx`(`owner_user_id`, `from_id`, `to_id`, `kind`),
  INDEX `splink_owner_idx`(`owner_user_id`),
  INDEX `splink_from_idx`(`from_id`),
  INDEX `splink_to_idx`(`to_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_police_suspect_cases` (
  `id` VARCHAR(191) NOT NULL,
  `suspect_id` VARCHAR(191) NOT NULL,
  `case_id` VARCHAR(191) NOT NULL,
  `role` VARCHAR(120) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `spsuspectcase_uidx`(`suspect_id`, `case_id`),
  INDEX `spsuspectcase_case_idx`(`case_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `smart_police_suspects` ADD CONSTRAINT `spsuspect_owner_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_suspect_addresses` ADD CONSTRAINT `spaddr_suspect_fkey` FOREIGN KEY (`suspect_id`) REFERENCES `smart_police_suspects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_investigation_logs` ADD CONSTRAINT `splog_owner_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_investigation_logs` ADD CONSTRAINT `splog_case_fkey` FOREIGN KEY (`case_id`) REFERENCES `smart_police_cases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `smart_police_investigation_logs` ADD CONSTRAINT `splog_suspect_fkey` FOREIGN KEY (`suspect_id`) REFERENCES `smart_police_suspects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `smart_police_investigation_reports` ADD CONSTRAINT `spreport_owner_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_investigation_reports` ADD CONSTRAINT `spreport_case_fkey` FOREIGN KEY (`case_id`) REFERENCES `smart_police_cases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `smart_police_links` ADD CONSTRAINT `splink_owner_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_links` ADD CONSTRAINT `splink_from_fkey` FOREIGN KEY (`from_id`) REFERENCES `smart_police_suspects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_links` ADD CONSTRAINT `splink_to_fkey` FOREIGN KEY (`to_id`) REFERENCES `smart_police_suspects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_suspect_cases` ADD CONSTRAINT `spsuspectcase_suspect_fkey` FOREIGN KEY (`suspect_id`) REFERENCES `smart_police_suspects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_suspect_cases` ADD CONSTRAINT `spsuspectcase_case_fkey` FOREIGN KEY (`case_id`) REFERENCES `smart_police_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
