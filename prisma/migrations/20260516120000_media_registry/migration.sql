-- ทะเบียนคุมสื่อ (อิง Google Apps Script media_system)

CREATE TABLE `media_registry_masters` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `master_type` VARCHAR(64) NOT NULL,
    `master_name` VARCHAR(200) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ใช้งาน',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `mrm_owner_type_sort_idx`(`owner_user_id`, `master_type`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `media_registry_locations` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `building` VARCHAR(120) NULL,
    `room` VARCHAR(120) NOT NULL,
    `cabinet` VARCHAR(80) NULL,
    `shelf` VARCHAR(80) NULL,
    `location_detail` VARCHAR(500) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ใช้งาน',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `mrl_owner_sort_idx`(`owner_user_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `media_registry_items` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `register_no` VARCHAR(64) NOT NULL,
    `media_name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `subject_group` VARCHAR(120) NULL,
    `grade_level` VARCHAR(80) NULL,
    `quantity_total` INTEGER NOT NULL,
    `quantity_available` INTEGER NOT NULL,
    `unit` VARCHAR(32) NOT NULL DEFAULT 'ชุด',
    `price_per_unit` DECIMAL(12, 2) NOT NULL,
    `total_price` DECIMAL(14, 2) NOT NULL,
    `media_status` VARCHAR(40) NOT NULL,
    `condition_now` VARCHAR(80) NULL,
    `budget_year` VARCHAR(8) NULL,
    `location_id` VARCHAR(191) NULL,
    `location_detail` VARCHAR(500) NULL,
    `responsible_teacher` VARCHAR(200) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `mri_owner_reg_uidx`(`owner_user_id`, `register_no`),
    INDEX `mri_owner_cat_idx`(`owner_user_id`, `category`),
    INDEX `mri_owner_status_idx`(`owner_user_id`, `media_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `media_registry_borrows` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `borrow_no` VARCHAR(64) NOT NULL,
    `media_id` VARCHAR(191) NOT NULL,
    `media_name` VARCHAR(255) NOT NULL,
    `borrower_name` VARCHAR(200) NOT NULL,
    `borrower_id` VARCHAR(64) NULL,
    `borrower_type` VARCHAR(40) NOT NULL DEFAULT 'ครู',
    `quantity_borrow` INTEGER NOT NULL,
    `quantity_return` INTEGER NOT NULL DEFAULT 0,
    `borrow_date` DATE NOT NULL,
    `due_date` DATE NULL,
    `return_date` DATE NULL,
    `purpose` VARCHAR(500) NULL,
    `condition_before` VARCHAR(80) NULL,
    `condition_after` VARCHAR(80) NULL,
    `approve_by` VARCHAR(120) NULL,
    `receiver_name` VARCHAR(120) NULL,
    `borrow_status` VARCHAR(40) NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `mrb_owner_borrow_uidx`(`owner_user_id`, `borrow_no`),
    INDEX `mrb_owner_status_idx`(`owner_user_id`, `borrow_status`),
    INDEX `mrb_media_idx`(`media_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `media_registry_issues` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `media_id` VARCHAR(191) NOT NULL,
    `media_name` VARCHAR(255) NOT NULL,
    `record_type` VARCHAR(40) NOT NULL,
    `quantity_affected` INTEGER NOT NULL DEFAULT 1,
    `cost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `detail` TEXT NULL,
    `repair_status` VARCHAR(40) NULL,
    `record_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `mris_owner_type_idx`(`owner_user_id`, `record_type`),
    INDEX `mris_media_idx`(`media_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `media_registry_masters`
    ADD CONSTRAINT `media_registry_masters_owner_user_id_fkey`
    FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `media_registry_locations`
    ADD CONSTRAINT `media_registry_locations_owner_user_id_fkey`
    FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `media_registry_items`
    ADD CONSTRAINT `media_registry_items_owner_user_id_fkey`
    FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `media_registry_items_location_id_fkey`
    FOREIGN KEY (`location_id`) REFERENCES `media_registry_locations`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `media_registry_borrows`
    ADD CONSTRAINT `media_registry_borrows_owner_user_id_fkey`
    FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `media_registry_borrows_media_id_fkey`
    FOREIGN KEY (`media_id`) REFERENCES `media_registry_items`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `media_registry_issues`
    ADD CONSTRAINT `media_registry_issues_owner_user_id_fkey`
    FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `media_registry_issues_media_id_fkey`
    FOREIGN KEY (`media_id`) REFERENCES `media_registry_items`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
