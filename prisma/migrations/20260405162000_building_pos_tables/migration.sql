CREATE TABLE `building_pos_categories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `name` VARCHAR(160) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 100,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `bpos_cat_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
  INDEX `bpos_cat_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `building_pos_menu_items` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `category_id` INTEGER NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `price` INTEGER NOT NULL,
  `description` VARCHAR(800) NOT NULL DEFAULT '',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `bpos_menu_owner_trial_cat_idx`(`owner_id`, `trial_session_id`, `category_id`),
  INDEX `bpos_menu_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `building_pos_orders` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `customer_name` VARCHAR(160) NOT NULL DEFAULT '',
  `table_no` VARCHAR(40) NOT NULL DEFAULT '',
  `status` VARCHAR(24) NOT NULL,
  `items_json` JSON NOT NULL,
  `total_amount` INTEGER NOT NULL DEFAULT 0,
  `note` VARCHAR(1000) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `bpos_order_owner_trial_created_idx`(`owner_id`, `trial_session_id`, `created_at`),
  INDEX `bpos_order_owner_idx`(`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `building_pos_categories`
  ADD CONSTRAINT `building_pos_categories_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `building_pos_menu_items`
  ADD CONSTRAINT `building_pos_menu_items_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `building_pos_orders`
  ADD CONSTRAINT `building_pos_orders_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
