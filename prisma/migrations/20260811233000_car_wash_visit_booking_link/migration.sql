-- Link car wash lane visits to queue bookings (portal + dashboard เพิ่มคิว)
ALTER TABLE `car_wash_visits`
  ADD COLUMN `booking_id` INT NULL;

CREATE UNIQUE INDEX `car_wash_visits_booking_id_key` ON `car_wash_visits`(`booking_id`);

ALTER TABLE `car_wash_visits`
  ADD CONSTRAINT `car_wash_visits_booking_id_fkey`
  FOREIGN KEY (`booking_id`) REFERENCES `car_wash_bookings`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
