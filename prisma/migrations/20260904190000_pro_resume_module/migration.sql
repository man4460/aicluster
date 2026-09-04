-- Pro Resume & Portfolio Builder
CREATE TABLE `resume_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `slug` VARCHAR(80) NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `position_title` VARCHAR(200) NOT NULL DEFAULT '',
    `bio` TEXT NOT NULL,
    `profile_image_url` VARCHAR(512) NULL,
    `contact_email` VARCHAR(200) NULL,
    `contact_phone` VARCHAR(32) NULL,
    `is_premium` BOOLEAN NOT NULL DEFAULT false,
    `public_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resume_profile_owner_trial_uniq`(`owner_id`, `trial_session_id`),
    UNIQUE INDEX `resume_profile_slug_trial_uniq`(`slug`, `trial_session_id`),
    INDEX `resume_profile_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `resume_educations` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `degree` VARCHAR(200) NOT NULL,
    `institution` VARCHAR(200) NOT NULL,
    `start_year` INTEGER NULL,
    `end_year` INTEGER NULL,
    `description` TEXT NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `resume_edu_profile_order_idx`(`profile_id`, `order_index`),
    INDEX `resume_edu_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `resume_experiences` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `job_title` VARCHAR(200) NOT NULL,
    `company` VARCHAR(200) NOT NULL,
    `start_date` VARCHAR(32) NOT NULL DEFAULT '',
    `end_date` VARCHAR(32) NULL,
    `achievements` TEXT NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `resume_exp_profile_order_idx`(`profile_id`, `order_index`),
    INDEX `resume_exp_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `resume_certificates` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `issued_by` VARCHAR(200) NOT NULL DEFAULT '',
    `year` INTEGER NULL,
    `file_url` VARCHAR(512) NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `resume_cert_profile_order_idx`(`profile_id`, `order_index`),
    INDEX `resume_cert_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `resume_portfolio_categories` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `resume_port_cat_profile_order_idx`(`profile_id`, `order_index`),
    INDEX `resume_port_cat_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `resume_portfolio_items` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `cover_image` VARCHAR(512) NULL,
    `short_desc` VARCHAR(500) NOT NULL DEFAULT '',
    `content_html` TEXT NOT NULL,
    `youtube_url` VARCHAR(512) NULL,
    `images_json` TEXT NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `click_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `resume_port_item_cat_order_idx`(`category_id`, `order_index`),
    INDEX `resume_port_item_profile_idx`(`profile_id`),
    INDEX `resume_port_item_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `resume_view_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `viewer_ip` VARCHAR(64) NULL,
    `viewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `device_type` VARCHAR(32) NULL,
    `portfolio_item_id` VARCHAR(191) NULL,

    INDEX `resume_view_profile_at_idx`(`profile_id`, `viewed_at`),
    INDEX `resume_view_owner_trial_at_idx`(`owner_id`, `trial_session_id`, `viewed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `resume_profiles` ADD CONSTRAINT `resume_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_educations` ADD CONSTRAINT `resume_educations_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_educations` ADD CONSTRAINT `resume_educations_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `resume_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_experiences` ADD CONSTRAINT `resume_experiences_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_experiences` ADD CONSTRAINT `resume_experiences_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `resume_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_certificates` ADD CONSTRAINT `resume_certificates_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_certificates` ADD CONSTRAINT `resume_certificates_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `resume_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_portfolio_categories` ADD CONSTRAINT `resume_portfolio_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_portfolio_categories` ADD CONSTRAINT `resume_portfolio_categories_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `resume_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_portfolio_items` ADD CONSTRAINT `resume_portfolio_items_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_portfolio_items` ADD CONSTRAINT `resume_portfolio_items_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `resume_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_portfolio_items` ADD CONSTRAINT `resume_portfolio_items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `resume_portfolio_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_view_analytics` ADD CONSTRAINT `resume_view_analytics_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_view_analytics` ADD CONSTRAINT `resume_view_analytics_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `resume_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
