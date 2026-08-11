ALTER TABLE `car_wash_bookings`
  ADD COLUMN `package_id` INT NULL,
  ADD COLUMN `package_name` VARCHAR(160) NOT NULL DEFAULT '' AFTER `package_id`;
