-- Smart Police module (สำนวนคดี / พิมพ์หมาย / รายงาน)

CREATE TABLE `smart_police_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `station_name` VARCHAR(200) NOT NULL,
    `station_address` TEXT NULL,
    `province` VARCHAR(120) NULL,
    `commander_rank` VARCHAR(80) NULL,
    `commander_name` VARCHAR(200) NULL,
    `investigator_default` VARCHAR(200) NULL,
    `case_number_prefix` VARCHAR(32) NOT NULL DEFAULT 'ส.',
    `print_footer` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `smart_police_profiles_owner_user_id_key`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_police_cases` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `case_number` VARCHAR(64) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `case_type` VARCHAR(80) NOT NULL DEFAULT 'คดีอาญา',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `incident_at` DATETIME(3) NULL,
    `incident_place` TEXT NULL,
    `summary` TEXT NULL,
    `print_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `spcase_owner_number_uidx`(`owner_user_id`, `case_number`),
    INDEX `spcase_owner_status_idx`(`owner_user_id`, `status`, `updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_police_parties` (
    `id` VARCHAR(191) NOT NULL,
    `case_id` VARCHAR(191) NOT NULL,
    `role` ENUM('COMPLAINANT', 'SUSPECT', 'WITNESS', 'OFFICER', 'OTHER') NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `age` INTEGER NULL,
    `nationality` VARCHAR(64) NULL DEFAULT 'ไทย',
    `id_card` VARCHAR(32) NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(32) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    INDEX `spparty_case_idx`(`case_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_police_documents` (
    `id` VARCHAR(191) NOT NULL,
    `case_id` VARCHAR(191) NOT NULL,
    `kind` ENUM('NARRATIVE', 'STATEMENT', 'WARRANT', 'REPORT', 'MEMO', 'OTHER') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` MEDIUMTEXT NOT NULL,
    `print_count` INTEGER NOT NULL DEFAULT 0,
    `last_printed_at` DATETIME(3) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `spdoc_case_kind_idx`(`case_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_police_templates` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NULL,
    `kind` ENUM('NARRATIVE', 'STATEMENT', 'WARRANT', 'REPORT', 'MEMO', 'OTHER') NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `content` MEDIUMTEXT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_builtin` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `sptpl_owner_kind_idx`(`owner_user_id`, `kind`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `smart_police_profiles` ADD CONSTRAINT `smart_police_profiles_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_cases` ADD CONSTRAINT `smart_police_cases_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_parties` ADD CONSTRAINT `smart_police_parties_case_id_fkey` FOREIGN KEY (`case_id`) REFERENCES `smart_police_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_documents` ADD CONSTRAINT `smart_police_documents_case_id_fkey` FOREIGN KEY (`case_id`) REFERENCES `smart_police_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_police_templates` ADD CONSTRAINT `smart_police_templates_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
