-- Laundry module: packages + orders (owner + trial_session scope)

CREATE TABLE `laundry_packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(160) NOT NULL,
    `pricing_model` VARCHAR(16) NOT NULL,
    `base_price` INTEGER NOT NULL,
    `duration_hours` INTEGER NOT NULL DEFAULT 24,
    `description` VARCHAR(800) NOT NULL DEFAULT '',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `laundry_pkg_owner_trial_active_idx`(`owner_id`, `trial_session_id`, `is_active`),
    INDEX `laundry_pkg_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `laundry_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `order_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customer_name` VARCHAR(160) NOT NULL,
    `customer_phone` VARCHAR(32) NOT NULL DEFAULT '',
    `pickup_address` VARCHAR(500) NOT NULL,
    `dropoff_address` VARCHAR(500) NOT NULL DEFAULT '',
    `service_type` VARCHAR(160) NOT NULL DEFAULT '',
    `package_id` INTEGER NULL,
    `package_name` VARCHAR(160) NOT NULL DEFAULT '',
    `weight_kg` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `item_count` INTEGER NOT NULL DEFAULT 0,
    `final_price` INTEGER NOT NULL DEFAULT 0,
    `note` VARCHAR(1000) NOT NULL DEFAULT '',
    `recorded_by_name` VARCHAR(160) NOT NULL DEFAULT '',
    `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING_PICKUP',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `laundry_ord_owner_trial_order_idx`(`owner_id`, `trial_session_id`, `order_at`),
    INDEX `laundry_ord_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `laundry_packages` ADD CONSTRAINT `laundry_packages_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `laundry_orders` ADD CONSTRAINT `laundry_orders_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `laundry_orders` ADD CONSTRAINT `laundry_orders_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `laundry_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
