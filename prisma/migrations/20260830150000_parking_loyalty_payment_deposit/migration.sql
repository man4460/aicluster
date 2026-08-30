ALTER TABLE `parking_sites`
  ADD COLUMN `loyalty_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `loyalty_baht_per_point` INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN `loyalty_points_per_unit` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `booking_payment_mode` ENUM('NONE', 'DEPOSIT', 'FULL') NOT NULL DEFAULT 'NONE',
  ADD COLUMN `deposit_percent` INTEGER NULL,
  ADD COLUMN `promptpay_phone` VARCHAR(32) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(64) NULL,
  ADD COLUMN `bank_account_name` VARCHAR(160) NULL;

ALTER TABLE `parking_sessions`
  ADD COLUMN `payment_method` VARCHAR(24) NULL,
  ADD COLUMN `payment_slip_url` VARCHAR(512) NULL,
  ADD COLUMN `member_phone` VARCHAR(20) NULL,
  ADD COLUMN `points_earned` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `parking_bookings`
  ADD COLUMN `payment_method` VARCHAR(24) NULL,
  ADD COLUMN `payment_slip_url` VARCHAR(512) NULL,
  ADD COLUMN `deposit_slip_url` VARCHAR(512) NULL,
  ADD COLUMN `deposit_amount_baht` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS `parking_loyalty_members` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `phone` VARCHAR(20) NOT NULL,
  `customer_name` VARCHAR(160) NOT NULL DEFAULT '',
  `points_balance` INTEGER NOT NULL DEFAULT 0,
  `total_earned` INTEGER NOT NULL DEFAULT 0,
  `total_redeemed` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `parking_loyalty_member_scope_phone_uniq` (`owner_user_id`, `trial_session_id`, `phone`),
  INDEX `parking_loyalty_member_scope_idx` (`owner_user_id`, `trial_session_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `parking_loyalty_members_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `parking_loyalty_ledgers` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `member_id` VARCHAR(191) NOT NULL,
  `kind` ENUM('EARN', 'REDEEM') NOT NULL,
  `points_delta` INTEGER NOT NULL,
  `balance_after` INTEGER NOT NULL,
  `session_id` INTEGER NULL,
  `note` VARCHAR(500) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `parking_loyalty_ledger_member_created_idx` (`member_id`, `created_at`),
  INDEX `parking_loyalty_ledger_scope_idx` (`owner_user_id`, `trial_session_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `parking_loyalty_ledgers_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `parking_loyalty_ledgers_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `parking_loyalty_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
