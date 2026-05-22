-- POS ร้านเครื่องดื่ม + สะสมแต้ม

CREATE TABLE `drink_pos_shop_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `stamps_per_reward` INTEGER NOT NULL DEFAULT 10,
    `reward_title` VARCHAR(160) NOT NULL DEFAULT 'เครื่องดื่มฟรี 1 แก้ว',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dp_shop_owner_trial_uq`(`owner_user_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drink_pos_categories` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `dp_cat_owner_sort_idx`(`owner_user_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drink_pos_products` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `price_baht` INTEGER NOT NULL DEFAULT 0,
    `image_url` VARCHAR(500) NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `dp_prod_owner_cat_idx`(`owner_user_id`, `category_id`),
    INDEX `dp_prod_owner_act_feat_idx`(`owner_user_id`, `is_active`, `is_featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drink_pos_members` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `phone` VARCHAR(20) NOT NULL,
    `customer_name` VARCHAR(120) NULL,
    `current_stamps` INTEGER NOT NULL DEFAULT 0,
    `total_redemptions` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dp_member_owner_trial_phone_uq`(`owner_user_id`, `trial_session_id`, `phone`),
    INDEX `dp_member_owner_trial_idx`(`owner_user_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drink_pos_sales` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NULL,
    `member_phone` VARCHAR(20) NULL,
    `is_reward_redemption` BOOLEAN NOT NULL DEFAULT false,
    `note` VARCHAR(500) NULL,
    `total_baht` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dp_sale_owner_created_idx`(`owner_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drink_pos_sale_lines` (
    `id` VARCHAR(191) NOT NULL,
    `sale_id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NULL,
    `product_name` VARCHAR(160) NOT NULL,
    `unit_price_baht` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `line_total_baht` INTEGER NOT NULL,

    INDEX `dp_saleline_sale_idx`(`sale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drink_pos_cost_entries` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(160) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `spent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(300) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dp_cost_owner_spent_idx`(`owner_user_id`, `spent_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `drink_pos_shop_profiles` ADD CONSTRAINT `drink_pos_shop_profiles_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `drink_pos_categories` ADD CONSTRAINT `drink_pos_categories_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `drink_pos_products` ADD CONSTRAINT `drink_pos_products_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `drink_pos_products` ADD CONSTRAINT `drink_pos_products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `drink_pos_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `drink_pos_members` ADD CONSTRAINT `drink_pos_members_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `drink_pos_sales` ADD CONSTRAINT `drink_pos_sales_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `drink_pos_sales` ADD CONSTRAINT `drink_pos_sales_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `drink_pos_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `drink_pos_sale_lines` ADD CONSTRAINT `drink_pos_sale_lines_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `drink_pos_sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `drink_pos_sale_lines` ADD CONSTRAINT `drink_pos_sale_lines_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `drink_pos_products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `drink_pos_cost_entries` ADD CONSTRAINT `drink_pos_cost_entries_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `module_list` (`id`, `slug`, `title`, `description`, `group_id`, `sort_order`, `is_active`, `created_at`, `updated_at`)
SELECT UUID(), 'drink-pos', 'POS ร้านเครื่องดื่ม', 'กลุ่ม 1 (Basic) — POS เครื่องดื่ม สะสมแต้ม · สายรายวัน 1 บาท/วันต่อโมดูล', 1, 30, true, NOW(3), NOW(3)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `module_list` WHERE `slug` = 'drink-pos');
