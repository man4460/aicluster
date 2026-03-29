-- AlterTable
ALTER TABLE `User` ADD COLUMN `last_dormitory_token_date` DATE NULL;

-- CreateTable
CREATE TABLE `dorm_rooms` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `room_number` VARCHAR(64) NOT NULL,
    `room_type` VARCHAR(128) NOT NULL,
    `monthly_rent` DECIMAL(12, 2) NOT NULL,
    `max_occupants` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dorm_rooms_owner_id_room_number_key`(`owner_id`, `room_number`),
    INDEX `dorm_rooms_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dorm_tenants` (
    `id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(64) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `dorm_tenants_room_id_idx`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dorm_utility_bills` (
    `id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `period_month` VARCHAR(7) NOT NULL,
    `water_prev` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `water_curr` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `water_rate_per_unit` DECIMAL(12, 4) NOT NULL,
    `electric_prev` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `electric_curr` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `electric_rate_per_unit` DECIMAL(12, 4) NOT NULL,
    `fixed_costs_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dorm_utility_bills_room_id_period_month_key`(`room_id`, `period_month`),
    INDEX `dorm_utility_bills_room_id_idx`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dorm_payments` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `billing_month` VARCHAR(7) NOT NULL,
    `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(500) NULL,

    INDEX `dorm_payments_owner_id_billing_month_idx`(`owner_id`, `billing_month`),
    INDEX `dorm_payments_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dorm_rooms` ADD CONSTRAINT `dorm_rooms_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dorm_tenants` ADD CONSTRAINT `dorm_tenants_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `dorm_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dorm_utility_bills` ADD CONSTRAINT `dorm_utility_bills_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `dorm_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dorm_payments` ADD CONSTRAINT `dorm_payments_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `dorm_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dorm_payments` ADD CONSTRAINT `dorm_payments_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `dorm_tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
