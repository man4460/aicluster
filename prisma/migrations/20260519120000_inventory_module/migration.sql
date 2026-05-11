-- inventory module: warehouses + categories + items + stocks + movements

CREATE TABLE `inventory_warehouses` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `address` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `inventory_warehouses_owner_code_uq`
  ON `inventory_warehouses`(`owner_id`, `code`);
CREATE INDEX `inventory_warehouses_owner_id_is_active_idx`
  ON `inventory_warehouses`(`owner_id`, `is_active`);

ALTER TABLE `inventory_warehouses`
  ADD CONSTRAINT `inventory_warehouses_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE `inventory_categories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `inventory_categories_owner_id_is_active_idx`
  ON `inventory_categories`(`owner_id`, `is_active`);

ALTER TABLE `inventory_categories`
  ADD CONSTRAINT `inventory_categories_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE `inventory_items` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `sku` VARCHAR(64) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `category_id` INTEGER NULL,
  `unit` VARCHAR(24) NOT NULL DEFAULT 'ชิ้น',
  `cost_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `sale_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `min_stock` INTEGER NOT NULL DEFAULT 0,
  `image_url` VARCHAR(500) NULL,
  `note` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `inventory_items_owner_sku_uq`
  ON `inventory_items`(`owner_id`, `sku`);
CREATE INDEX `inventory_items_owner_id_is_active_idx`
  ON `inventory_items`(`owner_id`, `is_active`);
CREATE INDEX `inventory_items_owner_id_category_id_idx`
  ON `inventory_items`(`owner_id`, `category_id`);

ALTER TABLE `inventory_items`
  ADD CONSTRAINT `inventory_items_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `inventory_items`
  ADD CONSTRAINT `inventory_items_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `inventory_categories`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;


CREATE TABLE `inventory_stocks` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `item_id` INTEGER NOT NULL,
  `warehouse_id` INTEGER NOT NULL,
  `quantity` INTEGER NOT NULL DEFAULT 0,
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `inventory_stock_item_warehouse_uq`
  ON `inventory_stocks`(`item_id`, `warehouse_id`);
CREATE INDEX `inventory_stocks_owner_id_warehouse_id_idx`
  ON `inventory_stocks`(`owner_id`, `warehouse_id`);
CREATE INDEX `inventory_stocks_owner_id_item_id_idx`
  ON `inventory_stocks`(`owner_id`, `item_id`);

ALTER TABLE `inventory_stocks`
  ADD CONSTRAINT `inventory_stocks_item_id_fkey`
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `inventory_stocks`
  ADD CONSTRAINT `inventory_stocks_warehouse_id_fkey`
  FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE `inventory_movements` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `type` ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST') NOT NULL,
  `item_id` INTEGER NOT NULL,
  `from_warehouse_id` INTEGER NULL,
  `to_warehouse_id` INTEGER NULL,
  `quantity` INTEGER NOT NULL,
  `unit_cost` DECIMAL(12, 2) NULL,
  `reference` VARCHAR(120) NULL,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `inventory_movements_owner_id_created_at_idx`
  ON `inventory_movements`(`owner_id`, `created_at`);
CREATE INDEX `inventory_movements_owner_id_item_id_idx`
  ON `inventory_movements`(`owner_id`, `item_id`);
CREATE INDEX `inventory_movements_owner_id_type_created_at_idx`
  ON `inventory_movements`(`owner_id`, `type`, `created_at`);

ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `inventory_movements_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `inventory_movements_item_id_fkey`
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `inventory_movements_from_warehouse_id_fkey`
  FOREIGN KEY (`from_warehouse_id`) REFERENCES `inventory_warehouses`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `inventory_movements_to_warehouse_id_fkey`
  FOREIGN KEY (`to_warehouse_id`) REFERENCES `inventory_warehouses`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
