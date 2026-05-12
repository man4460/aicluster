-- general store POS (simple): categories, products, sales + lines

CREATE TABLE `general_store_pos_categories` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `image_url` VARCHAR(500) NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `gsp_cat_owner_sort_idx` ON `general_store_pos_categories`(`owner_user_id`, `sort_order`);

ALTER TABLE `general_store_pos_categories`
  ADD CONSTRAINT `gsp_cat_owner_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE `general_store_pos_products` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `category_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `price_baht` INTEGER NOT NULL DEFAULT 0,
  `image_url` VARCHAR(500) NULL,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `gsp_prod_owner_cat_idx` ON `general_store_pos_products`(`owner_user_id`, `category_id`);
CREATE INDEX `gsp_prod_owner_act_feat_idx` ON `general_store_pos_products`(`owner_user_id`, `is_active`, `is_featured`);

ALTER TABLE `general_store_pos_products`
  ADD CONSTRAINT `gsp_prod_owner_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `general_store_pos_products`
  ADD CONSTRAINT `gsp_prod_cat_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `general_store_pos_categories`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE TABLE `general_store_pos_sales` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `note` VARCHAR(500) NULL,
  `total_baht` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `gsp_sale_owner_created_idx` ON `general_store_pos_sales`(`owner_user_id`, `created_at`);

ALTER TABLE `general_store_pos_sales`
  ADD CONSTRAINT `gsp_sale_owner_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE `general_store_pos_sale_lines` (
  `id` VARCHAR(191) NOT NULL,
  `sale_id` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(191) NULL,
  `product_name` VARCHAR(160) NOT NULL,
  `unit_price_baht` INTEGER NOT NULL,
  `quantity` INTEGER NOT NULL DEFAULT 1,
  `line_total_baht` INTEGER NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `gsp_saleline_sale_idx` ON `general_store_pos_sale_lines`(`sale_id`);

ALTER TABLE `general_store_pos_sale_lines`
  ADD CONSTRAINT `gsp_saleline_sale_fkey`
  FOREIGN KEY (`sale_id`) REFERENCES `general_store_pos_sales`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `general_store_pos_sale_lines`
  ADD CONSTRAINT `gsp_saleline_product_fkey`
  FOREIGN KEY (`product_id`) REFERENCES `general_store_pos_products`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
