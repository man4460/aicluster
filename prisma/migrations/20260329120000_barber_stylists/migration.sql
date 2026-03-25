-- ช่างตัดผม + ผู้ขายแพ็ก / ผู้บันทึกเช็คอิน
CREATE TABLE `barber_stylists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `barber_stylists_owner_id_idx`(`owner_id`),
    INDEX `barber_stylists_owner_id_is_active_idx`(`owner_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `barber_stylists` ADD CONSTRAINT `barber_stylists_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `customer_subscriptions` ADD COLUMN `sold_by_stylist_id` INTEGER NULL;
CREATE INDEX `customer_subscriptions_sold_by_stylist_id_idx` ON `customer_subscriptions`(`sold_by_stylist_id`);
ALTER TABLE `customer_subscriptions` ADD CONSTRAINT `customer_subscriptions_sold_by_stylist_id_fkey` FOREIGN KEY (`sold_by_stylist_id`) REFERENCES `barber_stylists`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `barber_service_logs` ADD COLUMN `stylist_id` INTEGER NULL;
CREATE INDEX `barber_service_logs_stylist_id_idx` ON `barber_service_logs`(`stylist_id`);
ALTER TABLE `barber_service_logs` ADD CONSTRAINT `barber_service_logs_stylist_id_fkey` FOREIGN KEY (`stylist_id`) REFERENCES `barber_stylists`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
