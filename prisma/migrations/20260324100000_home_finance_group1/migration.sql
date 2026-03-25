CREATE TABLE IF NOT EXISTS `home_finance_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `entry_date` DATE NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `category_key` VARCHAR(64) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `due_date` DATE NULL,
    `bill_number` VARCHAR(100) NULL,
    `vehicle_type` VARCHAR(40) NULL,
    `service_center` VARCHAR(160) NULL,
    `payment_method` VARCHAR(40) NULL,
    `note` VARCHAR(600) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `home_finance_entries_owner_id_entry_date_idx`(`owner_id`, `entry_date`),
    INDEX `home_finance_entries_owner_id_category_key_idx`(`owner_id`, `category_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_hf_o := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_entries'
    AND CONSTRAINT_NAME = 'home_finance_entries_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_hf_o := IF(@fk_hf_o = 0,
  'ALTER TABLE `home_finance_entries` ADD CONSTRAINT `home_finance_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hfo FROM @sql_hf_o; EXECUTE hfo; DEALLOCATE PREPARE hfo;
