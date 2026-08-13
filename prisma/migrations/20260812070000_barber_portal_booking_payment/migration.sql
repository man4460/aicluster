-- AlterTable
ALTER TABLE `barber_shop_profiles`
  ADD COLUMN `portal_booking_payment_mode` VARCHAR(16) NOT NULL DEFAULT 'NONE',
  ADD COLUMN `deposit_amount_baht` INTEGER NULL;

-- AlterTable
ALTER TABLE `barber_bookings`
  ADD COLUMN `package_price` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `deposit_amount_baht` INTEGER NULL,
  ADD COLUMN `amount_paid_baht` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `payment_method` VARCHAR(24) NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN `payment_status` VARCHAR(24) NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN `deposit_slip_url` VARCHAR(512) NULL,
  ADD COLUMN `payment_slip_url` VARCHAR(512) NULL;
