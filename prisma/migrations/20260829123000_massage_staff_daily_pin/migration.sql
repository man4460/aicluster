-- Staff daily PIN for massage staff kiosk (parity with barber)
ALTER TABLE `massage_shop_profiles`
  ADD COLUMN `staff_daily_pin_hash` VARCHAR(255) NULL;
