-- Dormitory income categories + manual income entries (mirror hotel-resort)
CREATE TABLE `dormitory_income_categories` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `kind` ENUM('TENANT_RENT', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `is_builtin` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `dorm_income_cat_owner_trial_sort_idx` ON `dormitory_income_categories`(`owner_id`, `trial_session_id`, `sort_order`);

ALTER TABLE `dormitory_income_categories`
  ADD CONSTRAINT `dormitory_income_categories_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `dormitory_income_entries` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
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

CREATE INDEX `dorm_income_owner_earned_idx` ON `dormitory_income_entries`(`owner_id`, `trial_session_id`, `earned_at`);
CREATE INDEX `dorm_income_category_idx` ON `dormitory_income_entries`(`category_id`);

ALTER TABLE `dormitory_income_entries`
  ADD CONSTRAINT `dormitory_income_entries_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `dormitory_income_entries`
  ADD CONSTRAINT `dormitory_income_entries_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `dormitory_income_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
