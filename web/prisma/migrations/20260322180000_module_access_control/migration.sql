-- Module access control: subscription type + module_list

-- CreateTable
CREATE TABLE `module_list` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `group_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `module_list_slug_key`(`slug`),
    INDEX `module_list_group_id_idx`(`group_id`),
    INDEX `module_list_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `subscription_type` ENUM('BUFFET', 'DAILY') NOT NULL DEFAULT 'DAILY';

-- ผู้ที่มี tier แพ็กเกจอยู่แล้ว → ถือเป็นเหมา
UPDATE `User` SET `subscription_type` = 'BUFFET' WHERE `subscription_tier` <> 'NONE';
