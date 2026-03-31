CREATE TABLE `car_wash_packages` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `name` VARCHAR(160) NOT NULL,
  `price` INTEGER NOT NULL,
  `duration_minutes` INTEGER NOT NULL DEFAULT 30,
  `description` VARCHAR(800) NOT NULL DEFAULT '',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `cwash_pkg_owner_trial_active_idx`(`owner_id`, `trial_session_id`, `is_active`),
  INDEX `cwash_pkg_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `car_wash_bundles` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `customer_name` VARCHAR(160) NOT NULL,
  `customer_phone` VARCHAR(32) NOT NULL DEFAULT '',
  `plate_number` VARCHAR(64) NOT NULL,
  `package_id` INTEGER NOT NULL,
  `package_name` VARCHAR(160) NOT NULL,
  `paid_amount` INTEGER NOT NULL DEFAULT 0,
  `total_uses` INTEGER NOT NULL DEFAULT 0,
  `used_uses` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `cwash_bundle_owner_trial_active_idx`(`owner_id`, `trial_session_id`, `is_active`),
  INDEX `cwash_bundle_owner_trial_phone_idx`(`owner_id`, `trial_session_id`, `customer_phone`),
  INDEX `cwash_bundle_owner_trial_plate_idx`(`owner_id`, `trial_session_id`, `plate_number`),
  INDEX `cwash_bundle_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `car_wash_visits` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `visit_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `customer_name` VARCHAR(160) NOT NULL,
  `customer_phone` VARCHAR(32) NOT NULL DEFAULT '',
  `plate_number` VARCHAR(64) NOT NULL,
  `package_id` INTEGER NULL,
  `package_name` VARCHAR(160) NOT NULL,
  `listed_price` INTEGER NOT NULL DEFAULT 0,
  `final_price` INTEGER NOT NULL DEFAULT 0,
  `note` VARCHAR(1000) NOT NULL DEFAULT '',
  `recorded_by_name` VARCHAR(160) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `cwash_visit_owner_trial_visit_idx`(`owner_id`, `trial_session_id`, `visit_at`),
  INDEX `cwash_visit_owner_trial_phone_idx`(`owner_id`, `trial_session_id`, `customer_phone`),
  INDEX `cwash_visit_owner_trial_plate_idx`(`owner_id`, `trial_session_id`, `plate_number`),
  INDEX `cwash_visit_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `car_wash_complaints` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `subject` VARCHAR(200) NOT NULL,
  `details` VARCHAR(2000) NOT NULL,
  `status` VARCHAR(40) NOT NULL,
  `photo_url` VARCHAR(512) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `cwash_cmp_owner_trial_created_idx`(`owner_id`, `trial_session_id`, `created_at`),
  INDEX `cwash_cmp_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `car_wash_packages`
  ADD CONSTRAINT `car_wash_packages_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `car_wash_bundles`
  ADD CONSTRAINT `car_wash_bundles_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `car_wash_visits`
  ADD CONSTRAINT `car_wash_visits_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `car_wash_complaints`
  ADD CONSTRAINT `car_wash_complaints_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
