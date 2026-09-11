-- AlterTable
ALTER TABLE `lms_profiles` ADD COLUMN `cert_signer_title` VARCHAR(160) NOT NULL DEFAULT 'ผู้ออกใบประกาศ' AFTER `cert_signer_name`;
