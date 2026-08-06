-- Drink POS: fulfillment status for kitchen / serve boards
ALTER TABLE `drink_pos_sales`
  ADD COLUMN `fulfillment_status` VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
  ADD COLUMN `status_updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE INDEX `dp_sale_owner_fulfill_idx` ON `drink_pos_sales`(`owner_user_id`, `fulfillment_status`, `status_updated_at`);
