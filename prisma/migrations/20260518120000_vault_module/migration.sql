-- CreateTable
CREATE TABLE `vault_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `service_name` VARCHAR(120) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `password_enc` TEXT NOT NULL,
    `website_url` VARCHAR(500) NULL,
    `category` VARCHAR(64) NULL,
    `brand_key` VARCHAR(64) NULL,
    `note` TEXT NULL,
    `is_favorite` BOOLEAN NOT NULL DEFAULT false,
    `last_used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vault_entries_owner_id_is_favorite_idx`(`owner_id`, `is_favorite`),
    INDEX `vault_entries_owner_id_last_used_at_idx`(`owner_id`, `last_used_at`),
    INDEX `vault_entries_owner_id_category_idx`(`owner_id`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vault_entries` ADD CONSTRAINT `vault_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
