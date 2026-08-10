-- Hotel resort income categories + manual income entries (mirror football-turf)
CREATE TABLE `hotel_resort_income_categories` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `kind` ENUM('ROOM_STAY', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `is_builtin` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `hr_income_cat_owner_sort_idx` ON `hotel_resort_income_categories`(`owner_user_id`, `sort_order`);

ALTER TABLE `hotel_resort_income_categories`
  ADD CONSTRAINT `hotel_resort_income_categories_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `hotel_resort_income_entries` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(160) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `earned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(300) NULL,
    `payment_slip_url` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `hr_income_owner_earned_idx` ON `hotel_resort_income_entries`(`owner_user_id`, `earned_at`);
CREATE INDEX `hr_income_category_idx` ON `hotel_resort_income_entries`(`category_id`);

ALTER TABLE `hotel_resort_income_entries`
  ADD CONSTRAINT `hotel_resort_income_entries_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `hotel_resort_income_entries`
  ADD CONSTRAINT `hotel_resort_income_entries_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `hotel_resort_income_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
