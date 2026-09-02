-- Laundry barber-parity: shop profile, customers, subscriptions, revenue categories

CREATE TABLE `laundry_shop_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `display_name` VARCHAR(200) NULL,
    `logo_url` VARCHAR(512) NULL,
    `tagline` VARCHAR(300) NULL,
    `tax_id` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `contact_phone` VARCHAR(32) NULL,
    `contact_line` VARCHAR(120) NULL,
    `facebook_url` VARCHAR(512) NULL,
    `map_url` VARCHAR(512) NULL,
    `shop_lat` DECIMAL(10, 7) NULL,
    `shop_lng` DECIMAL(10, 7) NULL,
    `prompt_pay_phone` VARCHAR(20) NULL,
    `prompt_pay_qr_image_url` VARCHAR(512) NULL,
    `bank_name` VARCHAR(120) NULL,
    `bank_account_number` VARCHAR(32) NULL,
    `bank_account_name` VARCHAR(200) NULL,
    `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58',
    `pay_amount_presets` VARCHAR(200) NOT NULL DEFAULT '80,100,120,150',
    `staff_daily_pin_hash` VARCHAR(255) NULL,
    `open_time` VARCHAR(5) NOT NULL DEFAULT '09:00',
    `close_time` VARCHAR(5) NOT NULL DEFAULT '20:00',
    `portal_banner_url` VARCHAR(512) NULL,
    `portal_gallery_json` TEXT NOT NULL,
    `portal_booking_payment_mode` VARCHAR(16) NOT NULL DEFAULT 'NONE',
    `deposit_amount_baht` INTEGER NULL,
    `pickup_fee_per_km_baht` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `laundry_shop_profiles_owner_id_trial_session_id_key`(`owner_id`, `trial_session_id`),
    INDEX `laundry_shop_profiles_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `laundry_shop_profiles` ADD CONSTRAINT `laundry_shop_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `laundry_packages` ADD COLUMN `total_sessions` INTEGER NOT NULL DEFAULT 1;

CREATE TABLE `laundry_customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `phone` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NULL,
    `tax_invoice_enabled` BOOLEAN NOT NULL DEFAULT false,
    `billing_name` VARCHAR(160) NOT NULL DEFAULT '',
    `tax_id` VARCHAR(30) NOT NULL DEFAULT '',
    `tax_address` VARCHAR(1000) NOT NULL DEFAULT '',
    `tax_branch` VARCHAR(120) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `laundry_customers_owner_id_phone_trial_session_id_key`(`owner_id`, `phone`, `trial_session_id`),
    INDEX `laundry_customers_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `laundry_customers` ADD CONSTRAINT `laundry_customers_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `laundry_customer_subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `laundry_customer_id` INTEGER NOT NULL,
    `package_id` INTEGER NOT NULL,
    `remaining_sessions` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'EXHAUSTED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `sale_receipt_image_url` VARCHAR(512) NULL,
    `payment_method` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `laundry_customer_subscriptions_owner_id_idx`(`owner_id`),
    INDEX `laundry_customer_subscriptions_laundry_customer_id_idx`(`laundry_customer_id`),
    INDEX `laundry_customer_subscriptions_package_id_idx`(`package_id`),
    INDEX `laundry_customer_subscriptions_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `laundry_customer_subscriptions` ADD CONSTRAINT `laundry_customer_subscriptions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `laundry_customer_subscriptions` ADD CONSTRAINT `laundry_customer_subscriptions_laundry_customer_id_fkey` FOREIGN KEY (`laundry_customer_id`) REFERENCES `laundry_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `laundry_customer_subscriptions` ADD CONSTRAINT `laundry_customer_subscriptions_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `laundry_packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `laundry_revenue_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `laundry_rev_cat_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `laundry_revenue_categories` ADD CONSTRAINT `laundry_revenue_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `laundry_revenue_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `category_id` INTEGER NOT NULL,
    `earned_at` DATETIME(3) NOT NULL,
    `amount` INTEGER NOT NULL,
    `item_label` VARCHAR(200) NOT NULL DEFAULT '',
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `slip_photo_url` VARCHAR(512) NOT NULL DEFAULT '',
    `payment_method` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `laundry_rev_ent_owner_trial_earned_idx`(`owner_id`, `trial_session_id`, `earned_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `laundry_revenue_entries` ADD CONSTRAINT `laundry_revenue_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `laundry_revenue_entries` ADD CONSTRAINT `laundry_revenue_entries_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `laundry_revenue_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `laundry_service_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `subscription_id` INTEGER NULL,
    `laundry_customer_id` INTEGER NOT NULL,
    `visit_type` ENUM('PACKAGE_USE', 'PACKAGE_SALE', 'CASH_WALK_IN') NOT NULL,
    `amount_baht` DECIMAL(10, 2) NULL,
    `receipt_image_url` VARCHAR(512) NULL,
    `payment_method` VARCHAR(20) NULL,
    `revenue_category_id` INTEGER NULL,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `laundry_service_logs_owner_id_created_at_idx`(`owner_id`, `created_at`),
    INDEX `laundry_service_logs_laundry_customer_id_idx`(`laundry_customer_id`),
    INDEX `laundry_service_logs_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `laundry_service_logs` ADD CONSTRAINT `laundry_service_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `laundry_service_logs` ADD CONSTRAINT `laundry_service_logs_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `laundry_customer_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `laundry_service_logs` ADD CONSTRAINT `laundry_service_logs_laundry_customer_id_fkey` FOREIGN KEY (`laundry_customer_id`) REFERENCES `laundry_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `laundry_service_logs` ADD CONSTRAINT `laundry_service_logs_revenue_category_id_fkey` FOREIGN KEY (`revenue_category_id`) REFERENCES `laundry_revenue_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `laundry_orders`
  ADD COLUMN `laundry_customer_id` INTEGER NULL,
  ADD COLUMN `subscription_id` INTEGER NULL,
  ADD COLUMN `pickup_lat` DECIMAL(10, 7) NULL,
  ADD COLUMN `pickup_lng` DECIMAL(10, 7) NULL,
  ADD COLUMN `distance_km` DECIMAL(10, 3) NULL,
  ADD COLUMN `payment_method` VARCHAR(24) NULL,
  ADD COLUMN `receipt_image_url` VARCHAR(512) NULL;

CREATE INDEX `laundry_orders_laundry_customer_id_idx` ON `laundry_orders`(`laundry_customer_id`);

ALTER TABLE `laundry_orders` ADD CONSTRAINT `laundry_orders_laundry_customer_id_fkey` FOREIGN KEY (`laundry_customer_id`) REFERENCES `laundry_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `laundry_orders` ADD CONSTRAINT `laundry_orders_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `laundry_customer_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
