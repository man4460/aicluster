-- AlterTable
ALTER TABLE `smart_police_cases` ADD COLUMN `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL';
