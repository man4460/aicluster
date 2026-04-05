-- AlterTable
ALTER TABLE `building_pos_orders` ADD COLUMN `customer_session_id` VARCHAR(40) NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX `bpos_order_owner_trial_table_custsess_idx` ON `building_pos_orders`(`owner_id`, `trial_session_id`, `table_no`, `customer_session_id`);
