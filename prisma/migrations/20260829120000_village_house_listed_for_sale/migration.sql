-- AlterTable
ALTER TABLE `village_houses`
  ADD COLUMN `listed_for_sale` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `vhouse_owner_trial_sale_idx` ON `village_houses`(`owner_id`, `trial_session_id`, `listed_for_sale`, `is_active`);
