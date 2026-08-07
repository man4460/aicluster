-- Drink POS public QR orders: customer session id on sales
ALTER TABLE `drink_pos_sales`
  ADD COLUMN `customer_session_id` VARCHAR(40) NULL;

CREATE INDEX `dp_sale_owner_custsess_created_idx`
  ON `drink_pos_sales`(`owner_user_id`, `customer_session_id`, `created_at`);
