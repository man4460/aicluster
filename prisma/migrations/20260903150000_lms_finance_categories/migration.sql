-- AlterTable
ALTER TABLE `lms_profiles` ADD COLUMN `finance_categories_json` VARCHAR(4000) NOT NULL DEFAULT '[]';
