-- AlterTable
ALTER TABLE `wait_queue_sites` ADD COLUMN `dashboard_locale` ENUM('TH', 'EN') NOT NULL DEFAULT 'EN';
ALTER TABLE `wait_queue_sites` ADD COLUMN `ticket_label_style` ENUM('PREFIX', 'NUMBERS_ONLY') NOT NULL DEFAULT 'PREFIX';
