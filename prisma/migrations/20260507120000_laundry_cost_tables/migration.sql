-- Laundry finance: cost categories & entries (mirror car_wash_cost_*)

CREATE TABLE `laundry_cost_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `laundry_cost_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `category_id` INTEGER NOT NULL,
    `spent_at` DATETIME(3) NOT NULL,
    `amount` INTEGER NOT NULL,
    `item_label` VARCHAR(200) NOT NULL DEFAULT '',
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `slip_photo_url` VARCHAR(512) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `laundry_cost_cat_owner_trial_idx` ON `laundry_cost_categories`(`owner_id`, `trial_session_id`);
CREATE INDEX `laundry_cost_ent_owner_trial_spent_idx` ON `laundry_cost_entries`(`owner_id`, `trial_session_id`, `spent_at`);

ALTER TABLE `laundry_cost_categories` ADD CONSTRAINT `laundry_cost_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `laundry_cost_entries` ADD CONSTRAINT `laundry_cost_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `laundry_cost_entries` ADD CONSTRAINT `laundry_cost_entries_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `laundry_cost_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
