-- Daily PIN for staff portal unlock (owner-set in module settings)
ALTER TABLE `drink_pos_shop_profiles`
  ADD COLUMN `staff_daily_pin_hash` VARCHAR(255) NULL AFTER `order_ticket_slip_paper_size`;

ALTER TABLE `hotel_resort_profiles`
  ADD COLUMN `staff_daily_pin_hash` VARCHAR(255) NULL AFTER `check_out_time`;

ALTER TABLE `module_shop_brandings`
  ADD COLUMN `staff_daily_pin_hash` VARCHAR(255) NULL AFTER `order_ticket_slip_paper_size`;
