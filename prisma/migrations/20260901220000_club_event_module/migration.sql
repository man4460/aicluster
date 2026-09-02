-- Club Event / บริหารชมรม

CREATE TABLE `club_event_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `slug` VARCHAR(80) NOT NULL,
    `display_name` VARCHAR(200) NOT NULL,
    `logo_url` VARCHAR(512) NULL,
    `tagline` VARCHAR(300) NULL,
    `rules_markdown` TEXT NOT NULL,
    `committee_json` TEXT NOT NULL,
    `contact_phone` VARCHAR(32) NULL,
    `contact_line` VARCHAR(120) NULL,
    `prompt_pay_phone` VARCHAR(20) NULL,
    `prompt_pay_qr_image_url` VARCHAR(512) NULL,
    `bank_name` VARCHAR(120) NULL,
    `bank_account_number` VARCHAR(32) NULL,
    `bank_account_name` VARCHAR(200) NULL,
    `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `club_event_profile_owner_trial_uniq`(`owner_id`, `trial_session_id`),
    UNIQUE INDEX `club_event_profile_slug_trial_uniq`(`slug`, `trial_session_id`),
    INDEX `club_event_profile_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `club_event_records` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `event_date` DATETIME(3) NOT NULL,
    `status` ENUM('UPCOMING', 'PAST') NOT NULL DEFAULT 'UPCOMING',
    `description` TEXT NOT NULL,
    `youtube_embed_url` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `club_event_rec_owner_trial_date_idx`(`owner_id`, `trial_session_id`, `event_date`),
    INDEX `club_event_rec_profile_status_idx`(`profile_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `club_event_gallery_images` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `event_id` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(512) NOT NULL,
    `file_name` VARCHAR(200) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `club_event_gallery_event_sort_idx`(`event_id`, `sort_order`),
    INDEX `club_event_gallery_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `club_event_members` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(32) NOT NULL DEFAULT '',
    `photo_url` VARCHAR(512) NULL,
    `custom_fields_json` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `club_event_member_owner_trial_idx`(`owner_id`, `trial_session_id`),
    INDEX `club_event_member_profile_active_idx`(`profile_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `club_event_finance_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `transacted_at` DATETIME(3) NOT NULL,
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `slip_url` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `club_event_fin_owner_trial_date_idx`(`owner_id`, `trial_session_id`, `transacted_at`),
    INDEX `club_event_fin_profile_type_idx`(`profile_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `club_event_assets` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('AVAILABLE', 'IN_USE', 'DAMAGED', 'RETIRED') NOT NULL DEFAULT 'AVAILABLE',
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `club_event_asset_owner_trial_idx`(`owner_id`, `trial_session_id`),
    INDEX `club_event_asset_profile_status_idx`(`profile_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `club_event_dynamic_links` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `type` ENUM('SURVEY', 'RSVP', 'PAYMENT', 'URL') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `config_json` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `club_event_link_owner_trial_idx`(`owner_id`, `trial_session_id`),
    INDEX `club_event_link_profile_active_idx`(`profile_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `club_event_profiles` ADD CONSTRAINT `club_event_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_event_records` ADD CONSTRAINT `club_event_records_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `club_event_records` ADD CONSTRAINT `club_event_records_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `club_event_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_event_gallery_images` ADD CONSTRAINT `club_event_gallery_images_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `club_event_gallery_images` ADD CONSTRAINT `club_event_gallery_images_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `club_event_records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_event_members` ADD CONSTRAINT `club_event_members_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `club_event_members` ADD CONSTRAINT `club_event_members_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `club_event_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_event_finance_transactions` ADD CONSTRAINT `club_event_finance_transactions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `club_event_finance_transactions` ADD CONSTRAINT `club_event_finance_transactions_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `club_event_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_event_assets` ADD CONSTRAINT `club_event_assets_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `club_event_assets` ADD CONSTRAINT `club_event_assets_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `club_event_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_event_dynamic_links` ADD CONSTRAINT `club_event_dynamic_links_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `club_event_dynamic_links` ADD CONSTRAINT `club_event_dynamic_links_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `club_event_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
