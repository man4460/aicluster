CREATE TABLE IF NOT EXISTS `barber_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `barber_customer_id` INTEGER NULL,
    `phone` VARCHAR(20) NOT NULL,
    `customer_name` VARCHAR(100) NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `status` ENUM('SCHEDULED', 'ARRIVED', 'NO_SHOW', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `barber_bookings_owner_id_scheduled_at_idx`(`owner_id`, `scheduled_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_owner := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'barber_bookings'
    AND CONSTRAINT_NAME = 'barber_bookings_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_owner := IF(@fk_owner = 0,
  'ALTER TABLE `barber_bookings` ADD CONSTRAINT `barber_bookings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE s1 FROM @sql_owner; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @fk_cust := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'barber_bookings'
    AND CONSTRAINT_NAME = 'barber_bookings_barber_customer_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_cust := IF(@fk_cust = 0,
  'ALTER TABLE `barber_bookings` ADD CONSTRAINT `barber_bookings_barber_customer_id_fkey` FOREIGN KEY (`barber_customer_id`) REFERENCES `barber_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE s2 FROM @sql_cust; EXECUTE s2; DEALLOCATE PREPARE s2;
