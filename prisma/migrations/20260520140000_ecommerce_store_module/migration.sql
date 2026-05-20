-- E-Commerce Store Builder: stores, products, orders, CRM buyers

CREATE TABLE `ecommerce_stores` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `store_name` VARCHAR(200) NOT NULL,
  `logo_url` VARCHAR(512) NULL,
  `description` TEXT NULL,
  `prompt_pay_phone` VARCHAR(20) NULL,
  `bank_name` VARCHAR(120) NULL,
  `bank_account_name` VARCHAR(200) NULL,
  `bank_account_number` VARCHAR(64) NULL,
  `payment_note` TEXT NULL,
  `custom_domain` VARCHAR(255) NULL,
  `custom_domain_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `sale_page_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `featured_product_id` VARCHAR(191) NULL,
  `low_stock_threshold` INTEGER NOT NULL DEFAULT 5,
  `merchant_paused` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ecstore_owner_trial_uniq` ON `ecommerce_stores`(`owner_id`, `trial_session_id`);
CREATE INDEX `ecstore_owner_idx` ON `ecommerce_stores`(`owner_id`);
CREATE INDEX `ecstore_custom_domain_idx` ON `ecommerce_stores`(`custom_domain`);

ALTER TABLE `ecommerce_stores`
  ADD CONSTRAINT `ecstore_owner_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE `ecommerce_products` (
  `id` VARCHAR(191) NOT NULL,
  `store_id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(512) NULL,
  `description` TEXT NULL,
  `price_baht` DECIMAL(12, 2) NOT NULL,
  `sku` VARCHAR(64) NULL,
  `stock_balance` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `ecprod_store_active_sort_idx` ON `ecommerce_products`(`store_id`, `is_active`, `sort_order`);
CREATE INDEX `ecprod_owner_idx` ON `ecommerce_products`(`owner_id`);
CREATE UNIQUE INDEX `ecprod_store_sku_uidx` ON `ecommerce_products`(`store_id`, `sku`);

ALTER TABLE `ecommerce_products`
  ADD CONSTRAINT `ecprod_store_fkey`
  FOREIGN KEY (`store_id`) REFERENCES `ecommerce_stores`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ecommerce_products`
  ADD CONSTRAINT `ecprod_owner_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ecommerce_stores`
  ADD CONSTRAINT `ecstore_featured_product_fkey`
  FOREIGN KEY (`featured_product_id`) REFERENCES `ecommerce_products`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;


CREATE TABLE `ecommerce_buyer_customers` (
  `id` VARCHAR(191) NOT NULL,
  `store_id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `total_spend_baht` DECIMAL(14, 2) NOT NULL DEFAULT 0,
  `order_count` INTEGER NOT NULL DEFAULT 0,
  `last_order_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ecbuyer_store_phone_uidx` ON `ecommerce_buyer_customers`(`store_id`, `phone`);
CREATE INDEX `ecbuyer_owner_idx` ON `ecommerce_buyer_customers`(`owner_id`);

ALTER TABLE `ecommerce_buyer_customers`
  ADD CONSTRAINT `ecbuyer_store_fkey`
  FOREIGN KEY (`store_id`) REFERENCES `ecommerce_stores`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ecommerce_buyer_customers`
  ADD CONSTRAINT `ecbuyer_owner_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE `ecommerce_orders` (
  `id` VARCHAR(191) NOT NULL,
  `store_id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `reference_code` VARCHAR(32) NOT NULL,
  `tracking_code` VARCHAR(24) NOT NULL,
  `customer_name` VARCHAR(200) NOT NULL,
  `customer_phone` VARCHAR(32) NOT NULL,
  `customer_address` TEXT NULL,
  `total_amount` DECIMAL(14, 2) NOT NULL,
  `payment_slip_url` VARCHAR(512) NULL,
  `status` ENUM('PENDING_SLIP', 'VERIFYING', 'PREPARING', 'SHIPPED') NOT NULL DEFAULT 'PENDING_SLIP',
  `buyer_customer_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `ecord_store_ref_uidx` ON `ecommerce_orders`(`store_id`, `reference_code`);
CREATE UNIQUE INDEX `ecord_tracking_uidx` ON `ecommerce_orders`(`tracking_code`);
CREATE INDEX `ecord_store_status_idx` ON `ecommerce_orders`(`store_id`, `status`, `created_at`);
CREATE INDEX `ecord_owner_idx` ON `ecommerce_orders`(`owner_id`);

ALTER TABLE `ecommerce_orders`
  ADD CONSTRAINT `ecord_store_fkey`
  FOREIGN KEY (`store_id`) REFERENCES `ecommerce_stores`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ecommerce_orders`
  ADD CONSTRAINT `ecord_owner_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ecommerce_orders`
  ADD CONSTRAINT `ecord_buyer_fkey`
  FOREIGN KEY (`buyer_customer_id`) REFERENCES `ecommerce_buyer_customers`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;


CREATE TABLE `ecommerce_order_items` (
  `id` VARCHAR(191) NOT NULL,
  `order_id` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(191) NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `quantity` INTEGER NOT NULL,
  `unit_price_baht` DECIMAL(12, 2) NOT NULL,
  `line_total_baht` DECIMAL(14, 2) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `ecorditem_order_idx` ON `ecommerce_order_items`(`order_id`);

ALTER TABLE `ecommerce_order_items`
  ADD CONSTRAINT `ecorditem_order_fkey`
  FOREIGN KEY (`order_id`) REFERENCES `ecommerce_orders`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ecommerce_order_items`
  ADD CONSTRAINT `ecorditem_product_fkey`
  FOREIGN KEY (`product_id`) REFERENCES `ecommerce_products`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
