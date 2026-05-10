-- CreateTable
CREATE TABLE `school_bank_settings` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `display_name` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `school_bank_settings_owner_trial_uniq`(`owner_user_id`, `trial_session_id`),
    INDEX `school_bank_settings_owner_idx`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_bank_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `settings_id` VARCHAR(191) NOT NULL,
    `member_code` VARCHAR(32) NOT NULL,
    `member_name` VARCHAR(120) NOT NULL,
    `classroom_label` VARCHAR(80) NULL,
    `balance_satang` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `school_bank_acc_settings_code_uniq`(`settings_id`, `member_code`),
    INDEX `school_bank_acc_owner_trial_idx`(`owner_user_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_bank_ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT', 'WITHDRAW', 'ADJUST') NOT NULL,
    `amount_satang` INTEGER NOT NULL,
    `balance_after_satang` INTEGER NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `school_bank_led_acc_created_idx`(`account_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_coop_settings` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `display_name` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `community_coop_settings_owner_trial_uniq`(`owner_user_id`, `trial_session_id`),
    INDEX `community_coop_settings_owner_idx`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_coop_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `settings_id` VARCHAR(191) NOT NULL,
    `member_code` VARCHAR(32) NOT NULL,
    `member_name` VARCHAR(120) NOT NULL,
    `group_label` VARCHAR(80) NULL,
    `share_units` INTEGER NOT NULL DEFAULT 0,
    `balance_satang` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `community_coop_acc_settings_code_uniq`(`settings_id`, `member_code`),
    INDEX `community_coop_acc_owner_trial_idx`(`owner_user_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_coop_ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT', 'WITHDRAW', 'DIVIDEND', 'ADJUST') NOT NULL,
    `amount_satang` INTEGER NOT NULL,
    `balance_after_satang` INTEGER NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `community_coop_led_acc_created_idx`(`account_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `school_bank_settings` ADD CONSTRAINT `school_bank_settings_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_bank_accounts` ADD CONSTRAINT `school_bank_accounts_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_bank_accounts` ADD CONSTRAINT `school_bank_accounts_settings_id_fkey` FOREIGN KEY (`settings_id`) REFERENCES `school_bank_settings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_bank_ledger_entries` ADD CONSTRAINT `school_bank_ledger_entries_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `school_bank_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_coop_settings` ADD CONSTRAINT `community_coop_settings_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_coop_accounts` ADD CONSTRAINT `community_coop_accounts_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_coop_accounts` ADD CONSTRAINT `community_coop_accounts_settings_id_fkey` FOREIGN KEY (`settings_id`) REFERENCES `community_coop_settings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_coop_ledger_entries` ADD CONSTRAINT `community_coop_ledger_entries_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `community_coop_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
