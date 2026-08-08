-- AlterTable
ALTER TABLE `football_turf_shop_profiles`
  ADD COLUMN `portal_booking_payment_mode` VARCHAR(16) NOT NULL DEFAULT 'NONE',
  ADD COLUMN `deposit_amount_baht` INTEGER NULL;
