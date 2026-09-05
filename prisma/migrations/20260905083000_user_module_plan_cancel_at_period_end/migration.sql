-- AlterTable
ALTER TABLE `user_module_plans`
  ADD COLUMN `cancel_at_period_end` BOOLEAN NOT NULL DEFAULT false;
