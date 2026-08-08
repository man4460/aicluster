-- Hotel resort: cost categories + link entries
CREATE TABLE `hotel_resort_cost_categories` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hr_cost_cat_owner_sort_idx`(`owner_user_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `hotel_resort_cost_categories`
  ADD CONSTRAINT `hotel_resort_cost_categories_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `hotel_resort_cost_entries`
  ADD COLUMN `category_id` VARCHAR(191) NULL;

-- Backfill: one «ทั่วไป» category per owner that already has cost rows
INSERT INTO `hotel_resort_cost_categories` (`id`, `owner_user_id`, `name`, `sort_order`, `created_at`, `updated_at`)
SELECT
  CONCAT('hrcat_', REPLACE(UUID(), '-', '')),
  e.`owner_user_id`,
  'ทั่วไป',
  0,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM (
  SELECT DISTINCT `owner_user_id` FROM `hotel_resort_cost_entries`
) e;

UPDATE `hotel_resort_cost_entries` e
INNER JOIN `hotel_resort_cost_categories` c
  ON c.`owner_user_id` = e.`owner_user_id` AND c.`name` = 'ทั่วไป'
SET e.`category_id` = c.`id`
WHERE e.`category_id` IS NULL;

CREATE INDEX `hr_cost_category_idx` ON `hotel_resort_cost_entries`(`category_id`);

ALTER TABLE `hotel_resort_cost_entries`
  ADD CONSTRAINT `hotel_resort_cost_entries_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `hotel_resort_cost_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
