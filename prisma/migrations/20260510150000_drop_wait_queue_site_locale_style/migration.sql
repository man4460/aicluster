-- Revert rolled-back wait-queue locale / ticket label style columns (if migration 20260510120000 was applied).
ALTER TABLE `wait_queue_sites` DROP COLUMN `dashboard_locale`;
ALTER TABLE `wait_queue_sites` DROP COLUMN `ticket_label_style`;
