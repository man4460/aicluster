-- AlterTable barber_shop_profiles
ALTER TABLE `barber_shop_profiles`
  ADD COLUMN `open_time` VARCHAR(5) NOT NULL DEFAULT '09:00',
  ADD COLUMN `close_time` VARCHAR(5) NOT NULL DEFAULT '20:00',
  ADD COLUMN `slot_minutes` INTEGER NOT NULL DEFAULT 30;

-- AlterTable barber_packages
ALTER TABLE `barber_packages`
  ADD COLUMN `duration_minutes` INTEGER NOT NULL DEFAULT 30;

-- AlterTable barber_bookings
ALTER TABLE `barber_bookings`
  ADD COLUMN `duration_minutes` INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN `stylist_id` INTEGER NULL,
  ADD COLUMN `package_id` INTEGER NULL;

CREATE INDEX `barber_bookings_stylist_id_scheduled_at_idx` ON `barber_bookings`(`stylist_id`, `scheduled_at`);

ALTER TABLE `barber_bookings`
  ADD CONSTRAINT `barber_bookings_stylist_id_fkey`
    FOREIGN KEY (`stylist_id`) REFERENCES `barber_stylists`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `barber_bookings`
  ADD CONSTRAINT `barber_bookings_package_id_fkey`
    FOREIGN KEY (`package_id`) REFERENCES `barber_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
