-- CreateEnum
-- AlterTable / CreateTable for football turf income categories + entries

CREATE TABLE `football_turf_income_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `kind` ENUM('COURT_RENTAL', 'PROMOTION', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `is_builtin` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ft_income_cat_owner_trial_idx`(`owner_id`, `trial_session_id`),
    INDEX `ft_income_cat_owner_trial_kind_idx`(`owner_id`, `trial_session_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_income_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `category_id` INTEGER NOT NULL,
    `earned_at` DATETIME(3) NOT NULL,
    `amount` INTEGER NOT NULL,
    `item_label` VARCHAR(200) NOT NULL DEFAULT '',
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `payment_slip_url` VARCHAR(512) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ft_income_ent_owner_trial_earned_idx`(`owner_id`, `trial_session_id`, `earned_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `football_turf_income_categories`
  ADD CONSTRAINT `football_turf_income_categories_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `football_turf_income_entries`
  ADD CONSTRAINT `football_turf_income_entries_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `football_turf_income_entries`
  ADD CONSTRAINT `football_turf_income_entries_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `football_turf_income_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
