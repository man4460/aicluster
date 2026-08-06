-- Football turf module

CREATE TABLE `football_turf_shop_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `venue_name` VARCHAR(200) NOT NULL DEFAULT '',
    `venue_subtitle` VARCHAR(300) NOT NULL DEFAULT '',
    `promptpay_number` VARCHAR(32) NOT NULL DEFAULT '',
    `bank_name` VARCHAR(120) NOT NULL DEFAULT '',
    `account_name` VARCHAR(200) NOT NULL DEFAULT '',
    `account_number` VARCHAR(32) NOT NULL DEFAULT '',
    `venue_address` TEXT NOT NULL,
    `tax_id` VARCHAR(30) NOT NULL DEFAULT '',
    `contact_phone` VARCHAR(32) NOT NULL DEFAULT '',
    `contact_line` VARCHAR(120) NOT NULL DEFAULT '',
    `note` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `football_turf_shop_profiles_owner_id_trial_session_id_key`(`owner_id`, `trial_session_id`),
    INDEX `football_turf_shop_profiles_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_courts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `open_time` VARCHAR(5) NOT NULL,
    `close_time` VARCHAR(5) NOT NULL,
    `slot_minutes` INTEGER NOT NULL DEFAULT 60,
    `weekday_price` INTEGER NOT NULL DEFAULT 0,
    `weekend_price` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `football_turf_courts_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(160) NOT NULL DEFAULT '',
    `phone` VARCHAR(32) NOT NULL,
    `team_name` VARCHAR(160) NOT NULL DEFAULT '',
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ft_cust_owner_trial_phone_uq`(`owner_id`, `trial_session_id`, `phone`),
    INDEX `ft_cust_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `court_id` INTEGER NOT NULL,
    `booking_date` DATE NOT NULL,
    `start_time` VARCHAR(5) NOT NULL,
    `end_time` VARCHAR(5) NOT NULL,
    `customer_name` VARCHAR(160) NOT NULL,
    `customer_phone` VARCHAR(32) NOT NULL,
    `team_name` VARCHAR(160) NOT NULL DEFAULT '',
    `player_count` INTEGER NOT NULL DEFAULT 0,
    `source` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `listed_price` INTEGER NOT NULL DEFAULT 0,
    `final_price` INTEGER NOT NULL DEFAULT 0,
    `promotion_sale_id` INTEGER NULL,
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `payment_method` VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    `payment_slip_data_url` TEXT NULL,
    `payment_reference` VARCHAR(120) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ft_book_owner_trial_date_idx`(`owner_id`, `trial_session_id`, `booking_date`),
    INDEX `football_turf_bookings_court_id_idx`(`court_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_promotions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(200) NOT NULL,
    `kind` VARCHAR(20) NOT NULL,
    `total_uses` INTEGER NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 60,
    `price` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `football_turf_promotions_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_promotion_sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `promotion_id` INTEGER NOT NULL,
    `promotion_name` VARCHAR(200) NOT NULL,
    `customer_name` VARCHAR(160) NOT NULL,
    `customer_phone` VARCHAR(32) NOT NULL,
    `team_name` VARCHAR(160) NOT NULL DEFAULT '',
    `total_uses` INTEGER NOT NULL,
    `remaining_uses` INTEGER NOT NULL,
    `price` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `football_turf_promotion_sales_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    INDEX `football_turf_promotion_sales_promotion_id_idx`(`promotion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_cost_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `football_turf_cost_categories_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_cost_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `category_id` INTEGER NOT NULL,
    `spent_at` DATETIME(3) NOT NULL,
    `amount` INTEGER NOT NULL,
    `item_label` VARCHAR(200) NOT NULL DEFAULT '',
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ft_cost_ent_owner_trial_spent_idx`(`owner_id`, `trial_session_id`, `spent_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `football_turf_shop_profiles` ADD CONSTRAINT `football_turf_shop_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `football_turf_courts` ADD CONSTRAINT `football_turf_courts_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `football_turf_customers` ADD CONSTRAINT `football_turf_customers_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `football_turf_bookings` ADD CONSTRAINT `football_turf_bookings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `football_turf_bookings` ADD CONSTRAINT `football_turf_bookings_court_id_fkey` FOREIGN KEY (`court_id`) REFERENCES `football_turf_courts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `football_turf_promotions` ADD CONSTRAINT `football_turf_promotions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `football_turf_promotion_sales` ADD CONSTRAINT `football_turf_promotion_sales_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `football_turf_promotion_sales` ADD CONSTRAINT `football_turf_promotion_sales_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `football_turf_promotions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `football_turf_cost_categories` ADD CONSTRAINT `football_turf_cost_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `football_turf_cost_entries` ADD CONSTRAINT `football_turf_cost_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `football_turf_cost_entries` ADD CONSTRAINT `football_turf_cost_entries_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `football_turf_cost_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
