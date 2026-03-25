-- CreateTable
CREATE TABLE `barber_portal_staff_pings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `barber_customer_id` INTEGER NULL,
    `subscription_id` INTEGER NULL,
    `phone_masked` VARCHAR(32) NOT NULL,
    `client_latitude` DOUBLE NULL,
    `client_longitude` DOUBLE NULL,
    `distance_meters` DOUBLE NULL,
    `geo_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `barber_portal_staff_pings_owner_id_created_at_idx`(`owner_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barber_portal_staff_pings` ADD CONSTRAINT `barber_portal_staff_pings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
