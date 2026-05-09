-- Doc Transmission module: digital correspondence (orders/memos/incoming/outgoing/circulars)

CREATE TABLE `doc_transmission_departments` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `contact_person` VARCHAR(120) NULL,
    `phone` VARCHAR(40) NULL,
    `email` VARCHAR(160) NULL,
    `is_internal` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `doc_dept_owner_trial_code_uidx`(`owner_id`, `trial_session_id`, `code`),
    INDEX `doc_dept_owner_trial_active_idx`(`owner_id`, `trial_session_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `doc_transmission_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `category` ENUM('ORDERS','MEMOS','INCOMING','OUTGOING','CIRCULARS') NOT NULL,
    `academic_year` VARCHAR(8) NOT NULL,
    `doc_number` VARCHAR(60) NOT NULL,
    `running_seq` INT NOT NULL,
    `subject` VARCHAR(500) NOT NULL,
    `person` VARCHAR(255) NULL,
    `department_id` INT NULL,
    `record_date` DATE NOT NULL,
    `due_date` DATE NULL,
    `status` ENUM('NORMAL','IN_PROGRESS','DONE','CANCELED') NOT NULL DEFAULT 'NORMAL',
    `priority` ENUM('NORMAL','URGENT','IMMEDIATE') NOT NULL DEFAULT 'NORMAL',
    `assignee_name` VARCHAR(160) NULL,
    `assignee_dept` VARCHAR(160) NULL,
    `attachment_url` VARCHAR(512) NULL,
    `attachment_name` VARCHAR(255) NULL,
    `public_share_token` VARCHAR(64) NULL,
    `public_share_enabled_at` DATETIME(3) NULL,
    `tracking_code` VARCHAR(40) NOT NULL,
    `note` TEXT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `doc_rec_owner_cat_year_seq_uidx`(`owner_id`, `trial_session_id`, `category`, `academic_year`, `running_seq`),
    UNIQUE INDEX `doc_rec_owner_trial_track_uidx`(`owner_id`, `trial_session_id`, `tracking_code`),
    UNIQUE INDEX `doc_transmission_records_public_share_token_key`(`public_share_token`),
    INDEX `doc_rec_owner_cat_idx`(`owner_id`, `trial_session_id`, `category`, `is_deleted`),
    INDEX `doc_rec_owner_status_idx`(`owner_id`, `trial_session_id`, `status`),
    INDEX `doc_rec_owner_date_idx`(`owner_id`, `trial_session_id`, `record_date`),
    INDEX `doc_rec_owner_due_idx`(`owner_id`, `trial_session_id`, `due_date`),
    INDEX `doc_rec_dept_idx`(`department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `doc_transmission_timeline_entries` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `record_id` BIGINT UNSIGNED NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `action` ENUM('CREATED','RECEIVED','REGISTERED','ASSIGNED','IN_TRANSIT','SIGNED','DELIVERED','COMPLETED','CANCELED','NOTE','FILE_REPLACED','STATUS_CHANGED') NOT NULL,
    `from_status` ENUM('NORMAL','IN_PROGRESS','DONE','CANCELED') NULL,
    `to_status` ENUM('NORMAL','IN_PROGRESS','DONE','CANCELED') NULL,
    `note` TEXT NULL,
    `actor_user_id` VARCHAR(191) NULL,
    `actor_name` VARCHAR(160) NULL,
    `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `doc_tl_rec_occ_idx`(`record_id`, `occurred_at`),
    INDEX `doc_tl_owner_occ_idx`(`owner_id`, `trial_session_id`, `occurred_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `doc_transmission_attachment_revisions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `record_id` BIGINT UNSIGNED NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `file_url` VARCHAR(512) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_size` INT NULL,
    `mime_type` VARCHAR(120) NULL,
    `version_no` INT NOT NULL,
    `note` TEXT NULL,
    `uploaded_by_user_id` VARCHAR(191) NULL,
    `uploaded_by_name` VARCHAR(160) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `doc_rev_rec_ver_uidx`(`record_id`, `version_no`),
    INDEX `doc_rev_owner_created_idx`(`owner_id`, `trial_session_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `doc_transmission_audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `record_id` BIGINT UNSIGNED NULL,
    `action` ENUM('CREATE','UPDATE','DELETE','STATUS_CHANGE','ASSIGN','FILE_REPLACE','SHARE_ENABLED','SHARE_DISABLED','TIMELINE_ADDED') NOT NULL,
    `snapshot` JSON NULL,
    `actor_user_id` VARCHAR(191) NULL,
    `actor_name` VARCHAR(160) NULL,
    `ip_address` VARCHAR(64) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `doc_audit_owner_created_idx`(`owner_id`, `trial_session_id`, `created_at`),
    INDEX `doc_audit_rec_created_idx`(`record_id`, `created_at`),
    INDEX `doc_audit_owner_action_idx`(`owner_id`, `trial_session_id`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `doc_transmission_settings` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `org_name` VARCHAR(200) NULL,
    `org_address` TEXT NULL,
    `org_phone` VARCHAR(40) NULL,
    `default_year` VARCHAR(8) NULL,
    `orders_prefix` VARCHAR(10) NOT NULL DEFAULT 'ORD',
    `memos_prefix` VARCHAR(10) NOT NULL DEFAULT 'MEM',
    `incoming_prefix` VARCHAR(10) NOT NULL DEFAULT 'IN',
    `outgoing_prefix` VARCHAR(10) NOT NULL DEFAULT 'OUT',
    `circulars_prefix` VARCHAR(10) NOT NULL DEFAULT 'CIR',
    `track_prefix` VARCHAR(10) NOT NULL DEFAULT 'DOC',
    `public_share_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `doc_set_owner_trial_uidx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `doc_transmission_departments`
    ADD CONSTRAINT `doc_transmission_departments_owner_id_fkey`
    FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `doc_transmission_records`
    ADD CONSTRAINT `doc_transmission_records_owner_id_fkey`
    FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `doc_transmission_records_department_id_fkey`
    FOREIGN KEY (`department_id`) REFERENCES `doc_transmission_departments`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `doc_transmission_timeline_entries`
    ADD CONSTRAINT `doc_transmission_timeline_entries_record_id_fkey`
    FOREIGN KEY (`record_id`) REFERENCES `doc_transmission_records`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `doc_transmission_timeline_entries_actor_user_id_fkey`
    FOREIGN KEY (`actor_user_id`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `doc_transmission_attachment_revisions`
    ADD CONSTRAINT `doc_transmission_attachment_revisions_record_id_fkey`
    FOREIGN KEY (`record_id`) REFERENCES `doc_transmission_records`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `doc_transmission_attachment_revisions_uploaded_by_fkey`
    FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `doc_transmission_audit_logs`
    ADD CONSTRAINT `doc_transmission_audit_logs_owner_id_fkey`
    FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `doc_transmission_audit_logs_record_id_fkey`
    FOREIGN KEY (`record_id`) REFERENCES `doc_transmission_records`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `doc_transmission_audit_logs_actor_user_id_fkey`
    FOREIGN KEY (`actor_user_id`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `doc_transmission_settings`
    ADD CONSTRAINT `doc_transmission_settings_owner_id_fkey`
    FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
