-- จองคิว + สะสมแต้ม — ช่องทางชำระแบบเดียวกับโมดูลอื่น
ALTER TABLE `appointment_queue_shop_profiles`
  ADD COLUMN `prompt_pay_phone` VARCHAR(20) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(32) NULL,
  ADD COLUMN `bank_account_name` VARCHAR(200) NULL,
  ADD COLUMN `tax_id` VARCHAR(30) NULL;

UPDATE `appointment_queue_shop_profiles`
SET
  `prompt_pay_phone` = COALESCE(`prompt_pay_phone`, `prompt_pay_id`),
  `bank_account_name` = COALESCE(`bank_account_name`, `prompt_pay_name`)
WHERE `prompt_pay_id` IS NOT NULL OR `prompt_pay_name` IS NOT NULL;

ALTER TABLE `loyalty_stamp_shop_profiles`
  ADD COLUMN `contact_phone` VARCHAR(32) NULL,
  ADD COLUMN `prompt_pay_phone` VARCHAR(20) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(32) NULL,
  ADD COLUMN `bank_account_name` VARCHAR(200) NULL,
  ADD COLUMN `tax_id` VARCHAR(30) NULL;
