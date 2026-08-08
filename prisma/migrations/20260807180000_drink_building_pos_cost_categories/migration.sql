-- Drink POS + Building POS: expense cost categories
CREATE TABLE `drink_pos_cost_categories` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `dp_cost_cat_owner_sort_idx`(`owner_user_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `drink_pos_cost_categories`
  ADD CONSTRAINT `drink_pos_cost_categories_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `drink_pos_cost_entries`
  ADD COLUMN `category_id` VARCHAR(191) NULL;

INSERT INTO `drink_pos_cost_categories` (`id`, `owner_user_id`, `name`, `sort_order`, `created_at`, `updated_at`)
SELECT
  CONCAT('dpcat_', REPLACE(UUID(), '-', '')),
  e.`owner_user_id`,
  'ทั่วไป',
  0,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM (
  SELECT DISTINCT `owner_user_id` FROM `drink_pos_cost_entries`
) e;

UPDATE `drink_pos_cost_entries` e
INNER JOIN `drink_pos_cost_categories` c
  ON c.`owner_user_id` = e.`owner_user_id` AND c.`name` = 'ทั่วไป'
SET e.`category_id` = c.`id`
WHERE e.`category_id` IS NULL;

CREATE INDEX `dp_cost_category_idx` ON `drink_pos_cost_entries`(`category_id`);

ALTER TABLE `drink_pos_cost_entries`
  ADD CONSTRAINT `drink_pos_cost_entries_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `drink_pos_cost_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `building_pos_cost_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bpos_cost_cat_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `building_pos_cost_categories`
  ADD CONSTRAINT `building_pos_cost_categories_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `building_pos_cost_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `category_id` INTEGER NULL,
    `label` VARCHAR(160) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `spent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(300) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bpos_cost_ent_owner_trial_spent_idx`(`owner_id`, `trial_session_id`, `spent_at`),
    INDEX `bpos_cost_ent_category_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `building_pos_cost_entries`
  ADD CONSTRAINT `building_pos_cost_entries_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `building_pos_cost_entries`
  ADD CONSTRAINT `building_pos_cost_entries_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `building_pos_cost_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
