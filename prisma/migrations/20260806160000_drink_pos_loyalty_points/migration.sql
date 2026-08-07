-- Drink POS: baht points loyalty (settings, rewards, ledger) + member/sale point columns
ALTER TABLE `drink_pos_members`
  ADD COLUMN `points_balance` INT NOT NULL DEFAULT 0,
  ADD COLUMN `total_earned` INT NOT NULL DEFAULT 0,
  ADD COLUMN `total_redeemed` INT NOT NULL DEFAULT 0;

ALTER TABLE `drink_pos_sales`
  ADD COLUMN `points_earned` INT NOT NULL DEFAULT 0,
  ADD COLUMN `points_redeemed` INT NOT NULL DEFAULT 0;

CREATE TABLE `drink_pos_loyalty_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `is_enabled` BOOLEAN NOT NULL DEFAULT false,
  `baht_per_point` INT NOT NULL DEFAULT 100,
  `points_per_unit` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `dp_loyalty_settings_owner_trial_uniq`(`owner_id`, `trial_session_id`),
  INDEX `dp_loyalty_settings_owner_idx`(`owner_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drink_pos_loyalty_rewards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `title` VARCHAR(160) NOT NULL,
  `product_id` VARCHAR(191) NULL,
  `points_cost` INT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 100,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `dp_loyalty_reward_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
  INDEX `dp_loyalty_reward_owner_idx`(`owner_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drink_pos_loyalty_ledgers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `member_id` VARCHAR(191) NOT NULL,
  `kind` VARCHAR(16) NOT NULL,
  `points_delta` INT NOT NULL,
  `balance_after` INT NOT NULL,
  `sale_id` VARCHAR(191) NULL,
  `reward_id` INT NULL,
  `note` VARCHAR(300) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `dp_loyalty_ledger_owner_trial_created_idx`(`owner_id`, `trial_session_id`, `created_at`),
  INDEX `dp_loyalty_ledger_member_created_idx`(`member_id`, `created_at`),
  INDEX `dp_loyalty_ledger_sale_idx`(`sale_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `drink_pos_loyalty_settings`
  ADD CONSTRAINT `drink_pos_loyalty_settings_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `drink_pos_loyalty_rewards`
  ADD CONSTRAINT `drink_pos_loyalty_rewards_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `drink_pos_loyalty_ledgers`
  ADD CONSTRAINT `drink_pos_loyalty_ledgers_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `drink_pos_loyalty_ledgers`
  ADD CONSTRAINT `drink_pos_loyalty_ledgers_member_id_fkey`
  FOREIGN KEY (`member_id`) REFERENCES `drink_pos_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `drink_pos_loyalty_ledgers`
  ADD CONSTRAINT `drink_pos_loyalty_ledgers_reward_id_fkey`
  FOREIGN KEY (`reward_id`) REFERENCES `drink_pos_loyalty_rewards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed settings from shop profiles + convert stamps → points (1 stamp = 1 point balance seed)
INSERT INTO `drink_pos_loyalty_settings` (`owner_id`, `trial_session_id`, `is_enabled`, `baht_per_point`, `points_per_unit`, `created_at`, `updated_at`)
SELECT `owner_user_id`, `trial_session_id`, true, 100, 1, NOW(3), NOW(3)
FROM `drink_pos_shop_profiles`
ON DUPLICATE KEY UPDATE `updated_at` = VALUES(`updated_at`);

INSERT INTO `drink_pos_loyalty_rewards` (`owner_id`, `trial_session_id`, `title`, `product_id`, `points_cost`, `sort_order`, `is_active`, `created_at`, `updated_at`)
SELECT `owner_user_id`, `trial_session_id`, `reward_title`, NULL, GREATEST(1, `stamps_per_reward`), 100, true, NOW(3), NOW(3)
FROM `drink_pos_shop_profiles`
WHERE CHAR_LENGTH(TRIM(`reward_title`)) > 0;

UPDATE `drink_pos_members`
SET `points_balance` = `current_stamps`,
    `total_earned` = GREATEST(`total_earned`, `current_stamps`)
WHERE `points_balance` = 0 AND `current_stamps` > 0;
