SET @col_cat_label := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_entries' AND COLUMN_NAME = 'category_label'
);
SET @sql_cat_label := IF(@col_cat_label = 0,
  'ALTER TABLE `home_finance_entries` ADD COLUMN `category_label` VARCHAR(100) NOT NULL DEFAULT ''อื่นๆ''',
  'SELECT 1');
PREPARE hfc1 FROM @sql_cat_label; EXECUTE hfc1; DEALLOCATE PREPARE hfc1;

CREATE TABLE IF NOT EXISTS `home_finance_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 100,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `home_finance_categories_owner_id_name_key`(`owner_id`, `name`),
    INDEX `home_finance_categories_owner_id_is_active_idx`(`owner_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_hfc_owner := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_categories'
    AND CONSTRAINT_NAME = 'home_finance_categories_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_hfc_owner := IF(@fk_hfc_owner = 0,
  'ALTER TABLE `home_finance_categories` ADD CONSTRAINT `home_finance_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hfc2 FROM @sql_hfc_owner; EXECUTE hfc2; DEALLOCATE PREPARE hfc2;

CREATE TABLE IF NOT EXISTS `home_utility_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `utility_type` ENUM('ELECTRIC', 'WATER') NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `provider` VARCHAR(120) NULL,
    `account_number` VARCHAR(80) NULL,
    `meter_number` VARCHAR(80) NULL,
    `default_due_day` INTEGER NULL,
    `note` VARCHAR(400) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `home_utility_profiles_owner_id_utility_type_is_active_idx`(`owner_id`, `utility_type`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_hup_owner := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_utility_profiles'
    AND CONSTRAINT_NAME = 'home_utility_profiles_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_hup_owner := IF(@fk_hup_owner = 0,
  'ALTER TABLE `home_utility_profiles` ADD CONSTRAINT `home_utility_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hfc3 FROM @sql_hup_owner; EXECUTE hfc3; DEALLOCATE PREPARE hfc3;

CREATE TABLE IF NOT EXISTS `home_vehicle_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `vehicle_type` ENUM('CAR', 'MOTORCYCLE') NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `brand` VARCHAR(80) NULL,
    `model` VARCHAR(80) NULL,
    `plate_number` VARCHAR(40) NULL,
    `vehicle_year` INTEGER NULL,
    `note` VARCHAR(400) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `home_vehicle_profiles_owner_id_vehicle_type_is_active_idx`(`owner_id`, `vehicle_type`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_hvp_owner := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_vehicle_profiles'
    AND CONSTRAINT_NAME = 'home_vehicle_profiles_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_hvp_owner := IF(@fk_hvp_owner = 0,
  'ALTER TABLE `home_vehicle_profiles` ADD CONSTRAINT `home_vehicle_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hfc4 FROM @sql_hvp_owner; EXECUTE hfc4; DEALLOCATE PREPARE hfc4;
