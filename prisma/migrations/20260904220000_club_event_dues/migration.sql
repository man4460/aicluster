-- CreateEnum
-- MySQL: Prisma stores enums as ENUM column type

-- AlterTable
ALTER TABLE `club_event_profiles`
  ADD COLUMN `dues_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `dues_amount_baht` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `dues_period` ENUM('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY') NOT NULL DEFAULT 'YEARLY',
  ADD COLUMN `dues_link_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS `club_event_dues_payments` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `profile_id` VARCHAR(191) NOT NULL,
  `member_id` VARCHAR(191) NULL,
  `payer_name` VARCHAR(160) NOT NULL,
  `payer_phone` VARCHAR(32) NOT NULL DEFAULT '',
  `member_code` VARCHAR(64) NOT NULL DEFAULT '',
  `amount_baht` INTEGER NOT NULL,
  `period_key` VARCHAR(32) NOT NULL,
  `period_label` VARCHAR(80) NOT NULL,
  `payment_method` VARCHAR(32) NULL,
  `slip_url` VARCHAR(512) NULL,
  `source` VARCHAR(24) NOT NULL DEFAULT 'DIRECT',
  `source_link_id` VARCHAR(191) NULL,
  `source_submission_id` VARCHAR(191) NULL,
  `source_event_id` VARCHAR(191) NULL,
  `note` VARCHAR(500) NOT NULL DEFAULT '',
  `paid_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `club_event_dues_profile_paid_idx`(`profile_id`, `paid_at`),
  INDEX `club_event_dues_profile_period_idx`(`profile_id`, `period_key`),
  INDEX `club_event_dues_owner_trial_idx`(`owner_id`, `trial_session_id`),
  CONSTRAINT `club_event_dues_payments_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `club_event_dues_payments_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `club_event_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
