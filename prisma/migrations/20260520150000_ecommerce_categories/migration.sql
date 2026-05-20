-- CreateTable
CREATE TABLE `ecommerce_categories` (
    `id` VARCHAR(191) NOT NULL,
    `store_id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `eccat_store_active_sort_idx`(`store_id`, `is_active`, `sort_order`),
    INDEX `eccat_owner_idx`(`owner_id`),
    UNIQUE INDEX `eccat_store_name_uidx`(`store_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `ecommerce_products` ADD COLUMN `category_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ecprod_store_category_idx` ON `ecommerce_products`(`store_id`, `category_id`);

-- AddForeignKey
ALTER TABLE `ecommerce_categories` ADD CONSTRAINT `ecommerce_categories_store_id_fkey` FOREIGN KEY (`store_id`) REFERENCES `ecommerce_stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecommerce_categories` ADD CONSTRAINT `ecommerce_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecommerce_products` ADD CONSTRAINT `ecommerce_products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `ecommerce_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
