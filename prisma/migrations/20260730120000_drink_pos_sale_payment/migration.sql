-- Drink POS sales: payment method + slip
ALTER TABLE `drink_pos_sales`
  ADD COLUMN `payment_method` VARCHAR(20) NOT NULL DEFAULT 'CASH',
  ADD COLUMN `payment_slip_url` VARCHAR(512) NULL;
