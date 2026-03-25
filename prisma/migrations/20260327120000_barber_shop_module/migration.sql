-- Barber / ร้านตัดผม — กลุ่ม 1
ALTER TABLE `User` ADD COLUMN `last_barber_token_date` DATE NULL;

CREATE TABLE `barber_packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `total_sessions` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `barber_packages_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `barber_customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `barber_customers_owner_id_phone_key`(`owner_id`, `phone`),
    INDEX `barber_customers_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `customer_subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `barber_customer_id` INTEGER NOT NULL,
    `package_id` INTEGER NOT NULL,
    `remaining_sessions` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'EXHAUSTED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `customer_subscriptions_owner_id_idx`(`owner_id`),
    INDEX `customer_subscriptions_barber_customer_id_idx`(`barber_customer_id`),
    INDEX `customer_subscriptions_package_id_idx`(`package_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `barber_service_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `subscription_id` INTEGER NULL,
    `barber_customer_id` INTEGER NOT NULL,
    `visit_type` ENUM('PACKAGE_USE', 'CASH_WALK_IN') NOT NULL,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `barber_service_logs_owner_id_created_at_idx`(`owner_id`, `created_at`),
    INDEX `barber_service_logs_barber_customer_id_idx`(`barber_customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `barber_packages` ADD CONSTRAINT `barber_packages_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `barber_customers` ADD CONSTRAINT `barber_customers_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `customer_subscriptions` ADD CONSTRAINT `customer_subscriptions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `customer_subscriptions` ADD CONSTRAINT `customer_subscriptions_barber_customer_id_fkey` FOREIGN KEY (`barber_customer_id`) REFERENCES `barber_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `customer_subscriptions` ADD CONSTRAINT `customer_subscriptions_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `barber_packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `barber_service_logs` ADD CONSTRAINT `barber_service_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `barber_service_logs` ADD CONSTRAINT `barber_service_logs_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `customer_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `barber_service_logs` ADD CONSTRAINT `barber_service_logs_barber_customer_id_fkey` FOREIGN KEY (`barber_customer_id`) REFERENCES `barber_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
