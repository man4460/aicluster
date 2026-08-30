CREATE TABLE IF NOT EXISTS `parking_reviews` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `guest_name` VARCHAR(120) NOT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `comment` VARCHAR(800) NOT NULL,
  `photo_urls_json` TEXT NOT NULL,
  `is_published` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `parking_review_owner_pub_created_idx`(`owner_user_id`, `trial_session_id`, `is_published`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
