-- AlterTable
ALTER TABLE `ecommerce_products` ADD COLUMN `is_recommended` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `ecommerce_products` ADD COLUMN `is_bestseller` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `ecprod_store_recommended_idx` ON `ecommerce_products`(`store_id`, `is_active`, `is_recommended`);
CREATE INDEX `ecprod_store_bestseller_idx` ON `ecommerce_products`(`store_id`, `is_active`, `is_bestseller`);
