-- AlterTable
ALTER TABLE `village_profiles` ADD COLUMN `bank_name` VARCHAR(120) NULL,
    ADD COLUMN `bank_account_number` VARCHAR(32) NULL,
    ADD COLUMN `bank_account_name` VARCHAR(200) NULL;
