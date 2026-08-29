-- Massage customer website portal (parity with barber)
ALTER TABLE `massage_shop_profiles`
  ADD COLUMN `tagline` VARCHAR(300) NULL,
  ADD COLUMN `contact_line` VARCHAR(120) NULL,
  ADD COLUMN `facebook_url` VARCHAR(512) NULL,
  ADD COLUMN `map_url` VARCHAR(512) NULL,
  ADD COLUMN `open_time` VARCHAR(5) NOT NULL DEFAULT '09:00',
  ADD COLUMN `close_time` VARCHAR(5) NOT NULL DEFAULT '21:00',
  ADD COLUMN `slot_minutes` INT NOT NULL DEFAULT 60,
  ADD COLUMN `portal_banner_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_gallery_json` TEXT NOT NULL DEFAULT ('[]'),
  ADD COLUMN `portal_booking_payment_mode` VARCHAR(16) NOT NULL DEFAULT 'NONE',
  ADD COLUMN `deposit_amount_baht` INT NULL;

ALTER TABLE `massage_packages`
  ADD COLUMN `image_url` VARCHAR(512) NULL,
  ADD COLUMN `duration_minutes` INT NOT NULL DEFAULT 60;

ALTER TABLE `massage_therapists`
  ADD COLUMN `work_start_time` VARCHAR(5) NOT NULL DEFAULT '09:00',
  ADD COLUMN `work_end_time` VARCHAR(5) NOT NULL DEFAULT '21:00',
  ADD COLUMN `work_weekdays_json` VARCHAR(64) NOT NULL DEFAULT '[0,1,2,3,4,5,6]';

ALTER TABLE `massage_bookings`
  ADD COLUMN `package_id` INT NULL,
  ADD COLUMN `package_price` INT NOT NULL DEFAULT 0,
  ADD COLUMN `deposit_amount_baht` INT NULL,
  ADD COLUMN `amount_paid_baht` INT NOT NULL DEFAULT 0,
  ADD COLUMN `payment_method` VARCHAR(24) NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN `payment_status` VARCHAR(24) NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN `deposit_slip_url` VARCHAR(512) NULL,
  ADD COLUMN `payment_slip_url` VARCHAR(512) NULL;

CREATE INDEX `massage_bookings_therapist_id_scheduled_at_idx` ON `massage_bookings`(`therapist_id`, `scheduled_at`);

ALTER TABLE `massage_bookings`
  ADD CONSTRAINT `massage_bookings_package_id_fkey`
  FOREIGN KEY (`package_id`) REFERENCES `massage_packages`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
