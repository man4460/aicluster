-- ช่องทางชำระและภาษี — ตั้งค่าแยกตามโมดูล
ALTER TABLE `module_shop_brandings`
  ADD COLUMN `prompt_pay_phone` VARCHAR(20) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(32) NULL,
  ADD COLUMN `bank_account_name` VARCHAR(200) NULL,
  ADD COLUMN `tax_id` VARCHAR(30) NULL;

ALTER TABLE `drink_pos_shop_profiles`
  ADD COLUMN `prompt_pay_phone` VARCHAR(20) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(32) NULL,
  ADD COLUMN `bank_account_name` VARCHAR(200) NULL,
  ADD COLUMN `tax_id` VARCHAR(30) NULL;

ALTER TABLE `hotel_resort_profiles`
  ADD COLUMN `prompt_pay_phone` VARCHAR(20) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(32) NULL,
  ADD COLUMN `bank_account_name` VARCHAR(200) NULL,
  ADD COLUMN `tax_id` VARCHAR(30) NULL;

ALTER TABLE `barber_shop_profiles`
  ADD COLUMN `prompt_pay_phone` VARCHAR(20) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(32) NULL,
  ADD COLUMN `bank_account_name` VARCHAR(200) NULL;

ALTER TABLE `massage_shop_profiles`
  ADD COLUMN `prompt_pay_phone` VARCHAR(20) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(32) NULL,
  ADD COLUMN `bank_account_name` VARCHAR(200) NULL;
