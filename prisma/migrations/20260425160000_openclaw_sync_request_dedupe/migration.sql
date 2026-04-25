CREATE TABLE `openclaw_sync_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `source` VARCHAR(40) NOT NULL,
  `request_id` VARCHAR(128) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `openclaw_sync_req_owner_source_req_uniq`(`owner_user_id`, `source`, `request_id`),
  INDEX `openclaw_sync_req_owner_created_idx`(`owner_user_id`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `openclaw_sync_requests`
  ADD CONSTRAINT `openclaw_sync_requests_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
