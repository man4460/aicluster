ALTER TABLE `football_turf_bookings` ADD COLUMN `amount_paid_baht` INT NOT NULL DEFAULT 0 AFTER `deposit_amount_baht`;

-- Backfill from portal deposit / pending review / paid status
UPDATE `football_turf_bookings`
SET `amount_paid_baht` = CASE
  WHEN `payment_status` = 'PAID' THEN `final_price`
  WHEN `payment_status` IN ('PENDING_REVIEW', 'PARTIAL') AND `deposit_amount_baht` IS NOT NULL AND `deposit_amount_baht` > 0 THEN `deposit_amount_baht`
  ELSE 0
END
WHERE `amount_paid_baht` = 0;

-- Deposit confirmed as PAID incorrectly → PARTIAL when deposit < total
UPDATE `football_turf_bookings`
SET `payment_status` = 'PARTIAL'
WHERE `payment_status` = 'PAID'
  AND `deposit_amount_baht` IS NOT NULL
  AND `deposit_amount_baht` > 0
  AND `deposit_amount_baht` < `final_price`
  AND `amount_paid_baht` < `final_price`;