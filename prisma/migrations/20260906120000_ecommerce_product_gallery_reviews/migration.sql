-- AlterTable
ALTER TABLE `ecommerce_products` ADD COLUMN `gallery_images_json` TEXT NOT NULL DEFAULT ('[]');

-- CreateTable
CREATE TABLE `ecommerce_product_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `store_id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(32) NOT NULL,
    `customer_name` VARCHAR(200) NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(800) NOT NULL DEFAULT '',
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ecrev_store_product_phone_uidx`(`store_id`, `product_id`, `customer_phone`),
    INDEX `ecrev_store_product_pub_idx`(`store_id`, `product_id`, `is_published`, `created_at`),
    INDEX `ecrev_order_idx`(`order_id`),
    INDEX `ecrev_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ecommerce_product_reviews` ADD CONSTRAINT `ecommerce_product_reviews_store_id_fkey` FOREIGN KEY (`store_id`) REFERENCES `ecommerce_stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (ตาราง User ใน MySQL ของโปรเจกต์นี้ชื่อ `User` ไม่ใช่ `users`)
ALTER TABLE `ecommerce_product_reviews` ADD CONSTRAINT `ecommerce_product_reviews_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecommerce_product_reviews` ADD CONSTRAINT `ecommerce_product_reviews_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `ecommerce_products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecommerce_product_reviews` ADD CONSTRAINT `ecommerce_product_reviews_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `ecommerce_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
