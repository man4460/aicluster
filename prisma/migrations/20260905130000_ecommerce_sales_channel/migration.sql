-- AlterTable
ALTER TABLE `ecommerce_orders`
  ADD COLUMN `sales_channel` ENUM('ONLINE', 'IN_STORE') NOT NULL DEFAULT 'ONLINE',
  ADD COLUMN `payment_method` VARCHAR(24) NULL;

-- CreateIndex
CREATE INDEX `ecord_store_channel_idx` ON `ecommerce_orders`(`store_id`, `sales_channel`, `created_at`);
