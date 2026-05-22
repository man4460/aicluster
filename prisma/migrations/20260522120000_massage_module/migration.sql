-- Massage shop module (group 1)

CREATE TABLE `massage_shop_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `display_name` VARCHAR(200) NULL,
    `logo_url` VARCHAR(512) NULL,
    `tax_id` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `contact_phone` VARCHAR(32) NULL,
    `default_slot_minutes` INTEGER NOT NULL DEFAULT 60,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `massage_shop_profiles_owner_id_trial_session_id_key`(`owner_id`, `trial_session_id`),
    INDEX `massage_shop_profiles_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_day_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `schedule_date` DATE NOT NULL,
    `open_time` VARCHAR(5) NOT NULL,
    `close_time` VARCHAR(5) NOT NULL,
    `slot_minutes` INTEGER NOT NULL DEFAULT 60,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `massage_day_sched_owner_trial_date_uq`(`owner_id`, `trial_session_id`, `schedule_date`),
    INDEX `massage_day_schedules_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `total_sessions` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `massage_packages_owner_id_idx`(`owner_id`),
    INDEX `massage_packages_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `phone` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `massage_customers_owner_id_phone_trial_session_id_key`(`owner_id`, `phone`, `trial_session_id`),
    INDEX `massage_customers_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_therapists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `photo_url` VARCHAR(512) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `massage_therapists_owner_id_idx`(`owner_id`),
    INDEX `massage_therapists_owner_id_is_active_idx`(`owner_id`, `is_active`),
    INDEX `massage_therapists_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `massage_customer_id` INTEGER NULL,
    `therapist_id` INTEGER NULL,
    `phone` VARCHAR(20) NOT NULL,
    `customer_name` VARCHAR(100) NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 60,
    `status` ENUM('SCHEDULED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `massage_bookings_owner_id_scheduled_at_idx`(`owner_id`, `scheduled_at`),
    INDEX `massage_bookings_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_customer_subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `massage_customer_id` INTEGER NOT NULL,
    `package_id` INTEGER NOT NULL,
    `sold_by_therapist_id` INTEGER NULL,
    `remaining_sessions` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'EXHAUSTED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `sale_receipt_image_url` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `massage_customer_subscriptions_owner_id_idx`(`owner_id`),
    INDEX `massage_customer_subscriptions_massage_customer_id_idx`(`massage_customer_id`),
    INDEX `massage_customer_subscriptions_package_id_idx`(`package_id`),
    INDEX `massage_customer_subscriptions_sold_by_therapist_id_idx`(`sold_by_therapist_id`),
    INDEX `massage_customer_subscriptions_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_service_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `subscription_id` INTEGER NULL,
    `massage_customer_id` INTEGER NOT NULL,
    `visit_type` ENUM('PACKAGE_USE', 'CASH_WALK_IN') NOT NULL,
    `therapist_id` INTEGER NULL,
    `amount_baht` DECIMAL(10, 2) NULL,
    `receipt_image_url` VARCHAR(512) NULL,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `massage_service_logs_owner_id_created_at_idx`(`owner_id`, `created_at`),
    INDEX `massage_service_logs_owner_id_trial_session_id_idx`(`owner_id`, `trial_session_id`),
    INDEX `massage_service_logs_massage_customer_id_idx`(`massage_customer_id`),
    INDEX `massage_service_logs_therapist_id_idx`(`therapist_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_cost_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `massage_cost_cat_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_cost_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `category_id` INTEGER NOT NULL,
    `spent_at` DATETIME(3) NOT NULL,
    `amount` INTEGER NOT NULL,
    `item_label` VARCHAR(200) NOT NULL DEFAULT '',
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `slip_photo_url` VARCHAR(512) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `massage_cost_ent_owner_trial_spent_idx`(`owner_id`, `trial_session_id`, `spent_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `massage_portal_staff_pings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `massage_customer_id` INTEGER NULL,
    `subscription_id` INTEGER NULL,
    `phone_masked` VARCHAR(32) NOT NULL,
    `client_latitude` DOUBLE NULL,
    `client_longitude` DOUBLE NULL,
    `distance_meters` DOUBLE NULL,
    `geo_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `massage_portal_staff_pings_owner_id_created_at_idx`(`owner_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `massage_shop_profiles` ADD CONSTRAINT `massage_shop_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_day_schedules` ADD CONSTRAINT `massage_day_schedules_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_packages` ADD CONSTRAINT `massage_packages_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_customers` ADD CONSTRAINT `massage_customers_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_therapists` ADD CONSTRAINT `massage_therapists_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_bookings` ADD CONSTRAINT `massage_bookings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_bookings` ADD CONSTRAINT `massage_bookings_massage_customer_id_fkey` FOREIGN KEY (`massage_customer_id`) REFERENCES `massage_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `massage_bookings` ADD CONSTRAINT `massage_bookings_therapist_id_fkey` FOREIGN KEY (`therapist_id`) REFERENCES `massage_therapists`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `massage_customer_subscriptions` ADD CONSTRAINT `massage_customer_subscriptions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_customer_subscriptions` ADD CONSTRAINT `massage_customer_subscriptions_massage_customer_id_fkey` FOREIGN KEY (`massage_customer_id`) REFERENCES `massage_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_customer_subscriptions` ADD CONSTRAINT `massage_customer_subscriptions_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `massage_packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `massage_customer_subscriptions` ADD CONSTRAINT `massage_customer_subscriptions_sold_by_therapist_id_fkey` FOREIGN KEY (`sold_by_therapist_id`) REFERENCES `massage_therapists`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `massage_service_logs` ADD CONSTRAINT `massage_service_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_service_logs` ADD CONSTRAINT `massage_service_logs_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `massage_customer_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `massage_service_logs` ADD CONSTRAINT `massage_service_logs_massage_customer_id_fkey` FOREIGN KEY (`massage_customer_id`) REFERENCES `massage_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_service_logs` ADD CONSTRAINT `massage_service_logs_therapist_id_fkey` FOREIGN KEY (`therapist_id`) REFERENCES `massage_therapists`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `massage_cost_categories` ADD CONSTRAINT `massage_cost_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_cost_entries` ADD CONSTRAINT `massage_cost_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_cost_entries` ADD CONSTRAINT `massage_cost_entries_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `massage_cost_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `massage_portal_staff_pings` ADD CONSTRAINT `massage_portal_staff_pings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
