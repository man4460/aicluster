-- AlterTable
ALTER TABLE `tenants`
  ADD COLUMN `booking_deposit_baht` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `security_deposit_baht` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `deposit_payment_method` VARCHAR(20) NULL,
  ADD COLUMN `damage_deduction_baht` DECIMAL(10, 2) NULL,
  ADD COLUMN `security_refund_baht` DECIMAL(10, 2) NULL,
  ADD COLUMN `move_out_note` VARCHAR(500) NULL;
