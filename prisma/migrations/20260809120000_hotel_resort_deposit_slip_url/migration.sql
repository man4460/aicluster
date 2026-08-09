-- AlterTable
ALTER TABLE `hotel_resort_bookings` ADD COLUMN `deposit_slip_url` VARCHAR(512) NULL;

-- Backfill: portal deposit / booking-time slip lived in payment_slip_url — move to deposit_slip_url
UPDATE `hotel_resort_bookings`
SET
  `deposit_slip_url` = `payment_slip_url`,
  `payment_slip_url` = NULL
WHERE `deposit_amount_baht` IS NOT NULL
  AND `deposit_amount_baht` > 0
  AND `payment_slip_url` IS NOT NULL
  AND `deposit_slip_url` IS NULL;