CREATE TABLE `system_activity_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_user_id` VARCHAR(191) NULL,
  `action` ENUM('CREATE', 'UPDATE', 'UPSERT', 'DELETE', 'CREATE_MANY', 'UPDATE_MANY', 'DELETE_MANY') NOT NULL,
  `model_name` VARCHAR(120) NOT NULL,
  `payload` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3) NOT NULL,
  INDEX `system_activity_logs_created_at_idx`(`created_at`),
  INDEX `system_activity_logs_expires_at_idx`(`expires_at`),
  INDEX `system_activity_logs_actor_user_id_created_at_idx`(`actor_user_id`, `created_at`),
  INDEX `system_activity_logs_model_name_created_at_idx`(`model_name`, `created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
