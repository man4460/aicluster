-- Add MQTT Service module to module_list (group 1)
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
  'mqtt-service-module',
  'mqtt-service',
  'ระบบบริการ MQTT',
  'กลุ่ม 1 (Basic) — จัดการ credentials, ACL, และสถานะการเชื่อมต่อสำหรับอุปกรณ์ IoT',
  1,
  19,
  TRUE,
  NOW(3),
  NOW(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `module_list` WHERE `slug` = 'mqtt-service'
);

CREATE TABLE `mqtt_tenant_profiles` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `tenant_code` VARCHAR(64) NOT NULL,
  `display_name` VARCHAR(160) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `mqtt_tenant_owner_trial_uniq`(`owner_id`, `trial_session_id`),
  UNIQUE INDEX `mqtt_tenant_code_uniq`(`tenant_code`),
  INDEX `mqtt_tenant_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mqtt_credentials` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `tenant_code` VARCHAR(64) NOT NULL,
  `client_id` VARCHAR(128) NOT NULL,
  `username` VARCHAR(128) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `label` VARCHAR(160) NOT NULL DEFAULT '',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `last_seen_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `mqtt_cred_owner_trial_client_uniq`(`owner_id`, `trial_session_id`, `client_id`),
  UNIQUE INDEX `mqtt_cred_owner_trial_user_uniq`(`owner_id`, `trial_session_id`, `username`),
  INDEX `mqtt_cred_owner_trial_active_idx`(`owner_id`, `trial_session_id`, `is_active`),
  INDEX `mqtt_cred_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mqtt_acl_rules` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `tenant_code` VARCHAR(64) NOT NULL,
  `subject_type` VARCHAR(24) NOT NULL,
  `subject_value` VARCHAR(128) NOT NULL,
  `action` VARCHAR(12) NOT NULL,
  `topic_pattern` VARCHAR(255) NOT NULL,
  `effect` VARCHAR(12) NOT NULL DEFAULT 'allow',
  `priority` INTEGER NOT NULL DEFAULT 100,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `mqtt_acl_owner_trial_active_idx`(`owner_id`, `trial_session_id`, `is_active`),
  INDEX `mqtt_acl_owner_trial_subject_idx`(`owner_id`, `trial_session_id`, `subject_type`, `subject_value`),
  INDEX `mqtt_acl_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mqtt_client_session_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `tenant_code` VARCHAR(64) NOT NULL,
  `client_id` VARCHAR(128) NOT NULL,
  `username` VARCHAR(128) NULL,
  `event_type` VARCHAR(24) NOT NULL,
  `ip_address` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `mqtt_sess_owner_trial_created_idx`(`owner_id`, `trial_session_id`, `created_at`),
  INDEX `mqtt_sess_owner_trial_client_idx`(`owner_id`, `trial_session_id`, `client_id`),
  INDEX `mqtt_sess_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mqtt_message_stat_daily` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `tenant_code` VARCHAR(64) NOT NULL,
  `stat_date` DATE NOT NULL,
  `publish_count` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `deliver_count` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `connect_count` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `unique_clients` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `mqtt_stat_owner_trial_date_uniq`(`owner_id`, `trial_session_id`, `stat_date`),
  INDEX `mqtt_stat_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `mqtt_tenant_profiles`
  ADD CONSTRAINT `mqtt_tenant_profiles_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `mqtt_credentials`
  ADD CONSTRAINT `mqtt_credentials_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `mqtt_acl_rules`
  ADD CONSTRAINT `mqtt_acl_rules_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `mqtt_client_session_logs`
  ADD CONSTRAINT `mqtt_client_session_logs_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `mqtt_message_stat_daily`
  ADD CONSTRAINT `mqtt_message_stat_daily_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
