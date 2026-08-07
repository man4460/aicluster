-- AlterTable building_pos_orders
ALTER TABLE `building_pos_orders`
  ADD COLUMN `member_phone` VARCHAR(20) NOT NULL DEFAULT '',
  ADD COLUMN `points_earned` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `points_redeemed` INTEGER NOT NULL DEFAULT 0;

CREATE INDEX `bpos_order_owner_trial_phone_idx` ON `building_pos_orders`(`owner_id`, `trial_session_id`, `member_phone`);

-- CreateTable building_pos_loyalty_settings
CREATE TABLE `building_pos_loyalty_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `is_enabled` BOOLEAN NOT NULL DEFAULT false,
    `baht_per_point` INTEGER NOT NULL DEFAULT 100,
    `points_per_unit` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bpos_loyalty_settings_owner_idx`(`owner_id`),
    UNIQUE INDEX `bpos_loyalty_settings_owner_trial_uniq`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable building_pos_loyalty_members
CREATE TABLE `building_pos_loyalty_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `phone` VARCHAR(20) NOT NULL,
    `customer_name` VARCHAR(160) NOT NULL DEFAULT '',
    `points_balance` INTEGER NOT NULL DEFAULT 0,
    `total_earned` INTEGER NOT NULL DEFAULT 0,
    `total_redeemed` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bpos_loyalty_member_owner_trial_idx`(`owner_id`, `trial_session_id`),
    INDEX `bpos_loyalty_member_owner_idx`(`owner_id`),
    UNIQUE INDEX `bpos_loyalty_member_owner_trial_phone_uniq`(`owner_id`, `trial_session_id`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable building_pos_loyalty_rewards
CREATE TABLE `building_pos_loyalty_rewards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `title` VARCHAR(160) NOT NULL,
    `menu_item_id` INTEGER NULL,
    `points_cost` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 100,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bpos_loyalty_reward_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
    INDEX `bpos_loyalty_reward_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable building_pos_loyalty_ledgers
CREATE TABLE `building_pos_loyalty_ledgers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `member_id` INTEGER NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `points_delta` INTEGER NOT NULL,
    `balance_after` INTEGER NOT NULL,
    `order_id` INTEGER NULL,
    `reward_id` INTEGER NULL,
    `note` VARCHAR(300) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bpos_loyalty_ledger_owner_trial_created_idx`(`owner_id`, `trial_session_id`, `created_at`),
    INDEX `bpos_loyalty_ledger_member_created_idx`(`member_id`, `created_at`),
    INDEX `bpos_loyalty_ledger_order_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `building_pos_loyalty_settings`
  ADD CONSTRAINT `building_pos_loyalty_settings_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `building_pos_loyalty_members`
  ADD CONSTRAINT `building_pos_loyalty_members_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `building_pos_loyalty_rewards`
  ADD CONSTRAINT `building_pos_loyalty_rewards_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `building_pos_loyalty_ledgers`
  ADD CONSTRAINT `building_pos_loyalty_ledgers_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `building_pos_loyalty_ledgers`
  ADD CONSTRAINT `building_pos_loyalty_ledgers_member_id_fkey`
  FOREIGN KEY (`member_id`) REFERENCES `building_pos_loyalty_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `building_pos_loyalty_ledgers`
  ADD CONSTRAINT `building_pos_loyalty_ledgers_reward_id_fkey`
  FOREIGN KEY (`reward_id`) REFERENCES `building_pos_loyalty_rewards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
