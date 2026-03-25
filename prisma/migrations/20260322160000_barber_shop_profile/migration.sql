-- CreateTable
CREATE TABLE IF NOT EXISTS `barber_shop_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(200) NULL,
    `logo_url` VARCHAR(512) NULL,
    `tax_id` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `contact_phone` VARCHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `barber_shop_profiles_owner_id_key`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'barber_shop_profiles'
    AND CONSTRAINT_NAME = 'barber_shop_profiles_owner_id_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @add_fk := IF(
  @fk_exists = 0,
  'ALTER TABLE `barber_shop_profiles` ADD CONSTRAINT `barber_shop_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @add_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
