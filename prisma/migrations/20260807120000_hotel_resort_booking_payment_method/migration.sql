-- Hotel resort bookings: payment method + slip (cash / PromptPay / transfer)
ALTER TABLE `hotel_resort_bookings`
  ADD COLUMN `payment_method` VARCHAR(20) NOT NULL DEFAULT 'CASH' AFTER `payment_status`,
  ADD COLUMN `payment_slip_url` VARCHAR(512) NULL AFTER `payment_method`;
