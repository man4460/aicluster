-- Parking finance: cost + income categories/entries

CREATE TABLE IF NOT EXISTS `parking_cost_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `parking_cost_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `category_id` INTEGER NOT NULL,
    `spent_at` DATETIME(3) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `label` VARCHAR(200) NOT NULL DEFAULT '',
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `payment_slip_url` VARCHAR(512) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `parking_cost_cat_owner_trial_sort_idx` ON `parking_cost_categories`(`owner_user_id`, `trial_session_id`, `sort_order`);
CREATE INDEX `parking_cost_ent_owner_trial_spent_idx` ON `parking_cost_entries`(`owner_user_id`, `trial_session_id`, `spent_at`);
CREATE INDEX `parking_cost_ent_category_idx` ON `parking_cost_entries`(`category_id`);

ALTER TABLE `parking_cost_categories`
  ADD CONSTRAINT `parking_cost_categories_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `parking_cost_entries`
  ADD CONSTRAINT `parking_cost_entries_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `parking_cost_entries`
  ADD CONSTRAINT `parking_cost_entries_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `parking_cost_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS `parking_income_categories` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `kind` ENUM('PARKING_SESSION', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `is_builtin` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `parking_income_entries` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `category_id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(160) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `earned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(300) NULL,
    `payment_slip_url` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `parking_income_cat_owner_trial_sort_idx` ON `parking_income_categories`(`owner_user_id`, `trial_session_id`, `sort_order`);
CREATE INDEX `parking_income_owner_earned_idx` ON `parking_income_entries`(`owner_user_id`, `trial_session_id`, `earned_at`);
CREATE INDEX `parking_income_category_idx` ON `parking_income_entries`(`category_id`);

ALTER TABLE `parking_income_categories`
  ADD CONSTRAINT `parking_income_categories_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `parking_income_entries`
  ADD CONSTRAINT `parking_income_entries_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `parking_income_entries`
  ADD CONSTRAINT `parking_income_entries_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `parking_income_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
