-- Prompt library (คลังคำสั่ง AI — อิง Prompt Master / Google Apps Script pms)

CREATE TABLE `prompt_library_categories` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(12) NOT NULL DEFAULT '📁',
    `color` VARCHAR(20) NOT NULL DEFAULT '#64748b',
    `description` VARCHAR(300) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `plc_owner_sort_idx`(`owner_user_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `prompt_library_prompts` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `description` VARCHAR(500) NULL,
    `tags` VARCHAR(512) NOT NULL DEFAULT '',
    `language` VARCHAR(16) NOT NULL DEFAULT 'th',
    `model_hint` VARCHAR(120) NULL,
    `temperature` DOUBLE NOT NULL DEFAULT 0.7,
    `is_favorite` BOOLEAN NOT NULL DEFAULT false,
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `usage_count` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `plp_owner_status_upd_idx`(`owner_user_id`, `status`, `updated_at`),
    INDEX `plp_owner_cat_idx`(`owner_user_id`, `category_id`),
    INDEX `plp_owner_fav_idx`(`owner_user_id`, `is_favorite`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `prompt_library_versions` (
    `id` VARCHAR(191) NOT NULL,
    `prompt_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `version_no` INTEGER NOT NULL,
    `change_note` VARCHAR(280) NULL,
    `created_by_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `plv_prompt_ver_idx`(`prompt_id`, `version_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `prompt_library_categories`
    ADD CONSTRAINT `prompt_library_categories_owner_user_id_fkey`
    FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `prompt_library_prompts`
    ADD CONSTRAINT `prompt_library_prompts_owner_user_id_fkey`
    FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `prompt_library_prompts_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `prompt_library_categories`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `prompt_library_versions`
    ADD CONSTRAINT `prompt_library_versions_prompt_id_fkey`
    FOREIGN KEY (`prompt_id`) REFERENCES `prompt_library_prompts`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `prompt_library_versions_created_by_id_fkey`
    FOREIGN KEY (`created_by_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
