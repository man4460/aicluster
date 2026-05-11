-- AlterTable: home_finance_categories — เพิ่มคอลัมน์รองรับ built-in (system_key, is_system)
ALTER TABLE `home_finance_categories`
  ADD COLUMN `system_key` VARCHAR(64) NULL AFTER `owner_id`,
  ADD COLUMN `is_system` BOOLEAN NOT NULL DEFAULT FALSE AFTER `system_key`;

-- Unique: (owner_id, system_key) — MySQL อนุญาตให้มีหลาย NULL ภายใต้ unique index
CREATE UNIQUE INDEX `home_finance_categories_owner_id_system_key_key`
  ON `home_finance_categories`(`owner_id`, `system_key`);
