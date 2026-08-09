-- Football turf loyalty + booking/sale points columns
ALTER TABLE `football_turf_bookings`
  ADD COLUMN `points_earned` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `points_redeemed` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `football_turf_promotion_sales`
  ADD COLUMN `points_earned` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `points_redeemed` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `football_turf_loyalty_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `is_enabled` BOOLEAN NOT NULL DEFAULT false,
    `baht_per_point` INTEGER NOT NULL DEFAULT 100,
    `points_per_unit` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ft_loyalty_settings_owner_idx`(`owner_id`),
    UNIQUE INDEX `ft_loyalty_settings_owner_trial_uq`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_loyalty_members` (
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

    INDEX `ft_loyalty_member_owner_trial_idx`(`owner_id`, `trial_session_id`),
    INDEX `ft_loyalty_member_owner_idx`(`owner_id`),
    UNIQUE INDEX `ft_loyalty_member_owner_trial_phone_uq`(`owner_id`, `trial_session_id`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_loyalty_rewards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `title` VARCHAR(160) NOT NULL,
    `points_cost` INTEGER NOT NULL,
    `image_url` VARCHAR(512) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 100,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ft_loyalty_reward_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
    INDEX `ft_loyalty_reward_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `football_turf_loyalty_ledgers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `member_id` INTEGER NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `points_delta` INTEGER NOT NULL,
    `balance_after` INTEGER NOT NULL,
    `booking_id` INTEGER NULL,
    `promotion_sale_id` INTEGER NULL,
    `reward_id` INTEGER NULL,
    `note` VARCHAR(300) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ft_loyalty_ledger_owner_trial_created_idx`(`owner_id`, `trial_session_id`, `created_at`),
    INDEX `ft_loyalty_ledger_member_created_idx`(`member_id`, `created_at`),
    INDEX `ft_loyalty_ledger_booking_idx`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `football_turf_loyalty_settings`
  ADD CONSTRAINT `football_turf_loyalty_settings_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `football_turf_loyalty_members`
  ADD CONSTRAINT `football_turf_loyalty_members_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `football_turf_loyalty_rewards`
  ADD CONSTRAINT `football_turf_loyalty_rewards_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `football_turf_loyalty_ledgers`
  ADD CONSTRAINT `football_turf_loyalty_ledgers_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `football_turf_loyalty_ledgers`
  ADD CONSTRAINT `football_turf_loyalty_ledgers_member_id_fkey`
  FOREIGN KEY (`member_id`) REFERENCES `football_turf_loyalty_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `football_turf_loyalty_ledgers`
  ADD CONSTRAINT `football_turf_loyalty_ledgers_reward_id_fkey`
  FOREIGN KEY (`reward_id`) REFERENCES `football_turf_loyalty_rewards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
