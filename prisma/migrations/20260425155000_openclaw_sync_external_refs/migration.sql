ALTER TABLE `ai_notes`
  ADD COLUMN `external_source` VARCHAR(40) NULL,
  ADD COLUMN `external_id` VARCHAR(128) NULL,
  ADD COLUMN `last_synced_at` DATETIME(3) NULL;

CREATE INDEX `ai_notes_user_external_idx`
  ON `ai_notes`(`user_id`, `external_source`, `external_id`);

ALTER TABLE `ai_plans`
  ADD COLUMN `external_source` VARCHAR(40) NULL,
  ADD COLUMN `external_id` VARCHAR(128) NULL,
  ADD COLUMN `last_synced_at` DATETIME(3) NULL;

CREATE INDEX `ai_plans_user_external_idx`
  ON `ai_plans`(`user_id`, `external_source`, `external_id`);

ALTER TABLE `home_finance_entries`
  ADD COLUMN `external_source` VARCHAR(40) NULL,
  ADD COLUMN `external_id` VARCHAR(128) NULL,
  ADD COLUMN `last_synced_at` DATETIME(3) NULL;

CREATE INDEX `home_finance_entries_owner_external_idx`
  ON `home_finance_entries`(`owner_id`, `external_source`, `external_id`);
