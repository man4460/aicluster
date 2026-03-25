-- ลบตารางหอพักแบบเดิม (String/cuid)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `dorm_payments`;
DROP TABLE IF EXISTS `dorm_utility_bills`;
DROP TABLE IF EXISTS `dorm_tenants`;
DROP TABLE IF EXISTS `dorm_rooms`;
SET FOREIGN_KEY_CHECKS = 1;

-- ห้องพัก (INT PK) — owner เชื่อมผู้ใช้ MAWELL ตาราง `User`
CREATE TABLE `rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `room_number` VARCHAR(10) NOT NULL,
    `floor` INTEGER NOT NULL,
    `room_type` VARCHAR(50) NOT NULL,
    `max_occupants` INTEGER NOT NULL DEFAULT 1,
    `base_price` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rooms_owner_id_room_number_key`(`owner_id`, `room_number`),
    INDEX `rooms_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tenants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `id_card` VARCHAR(13) NOT NULL,
    `status` ENUM('ACTIVE', 'MOVED_OUT') NOT NULL DEFAULT 'ACTIVE',
    `check_in_date` DATE NOT NULL,
    `check_out_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tenants_room_id_idx`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `utility_bills` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `billing_month` INTEGER NOT NULL,
    `billing_year` INTEGER NOT NULL,
    `water_meter_prev` INTEGER NOT NULL,
    `water_meter_curr` INTEGER NOT NULL,
    `electric_meter_prev` INTEGER NOT NULL,
    `electric_meter_curr` INTEGER NOT NULL,
    `water_price` DECIMAL(10, 2) NOT NULL,
    `electric_price` DECIMAL(10, 2) NOT NULL,
    `fixed_fees` JSON NULL,
    `total_room_amount` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `utility_bills_room_id_billing_year_billing_month_key`(`room_id`, `billing_year`, `billing_month`),
    INDEX `utility_bills_room_id_idx`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `bill_id` INTEGER NOT NULL,
    `amount_to_pay` DECIMAL(10, 2) NOT NULL,
    `payment_status` ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `paid_at` DATETIME(3) NULL,
    `receipt_number` VARCHAR(32) NULL,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_receipt_number_key`(`receipt_number`),
    UNIQUE INDEX `payments_tenant_id_bill_id_key`(`tenant_id`, `bill_id`),
    INDEX `payments_tenant_id_idx`(`tenant_id`),
    INDEX `payments_bill_id_idx`(`bill_id`),
    INDEX `payments_payment_status_idx`(`payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `rooms` ADD CONSTRAINT `rooms_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `tenants` ADD CONSTRAINT `tenants_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `utility_bills` ADD CONSTRAINT `utility_bills_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `payments` ADD CONSTRAINT `payments_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `payments` ADD CONSTRAINT `payments_bill_id_fkey` FOREIGN KEY (`bill_id`) REFERENCES `utility_bills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
