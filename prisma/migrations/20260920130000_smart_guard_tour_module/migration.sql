-- CreateTable
CREATE TABLE `smart_guard_shops` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `slug` VARCHAR(80) NOT NULL,
    `display_name` VARCHAR(200) NOT NULL,
    `logo_url` VARCHAR(512) NULL,
    `tagline` VARCHAR(300) NULL,
    `address` TEXT NULL,
    `contact_phone` VARCHAR(32) NULL,
    `emergency_phone` VARCHAR(32) NULL,
    `contact_line` VARCHAR(120) NULL,
    `line_notify_token` VARCHAR(255) NULL,
    `facebook_url` VARCHAR(512) NULL,
    `map_url` VARCHAR(512) NULL,
    `shop_lat` DECIMAL(10, 7) NULL,
    `shop_lng` DECIMAL(10, 7) NULL,
    `open_time_hm` VARCHAR(5) NULL,
    `close_time_hm` VARCHAR(5) NULL,
    `portal_banner_url` VARCHAR(512) NULL,
    `portal_gallery_json` TEXT NOT NULL,
    `portal_enabled` BOOLEAN NOT NULL DEFAULT true,
    `portal_sos_enabled` BOOLEAN NOT NULL DEFAULT true,
    `portal_intro_html` TEXT NULL,
    `payout_mode` VARCHAR(16) NOT NULL DEFAULT 'NONE',
    `prompt_pay_phone` VARCHAR(20) NULL,
    `prompt_pay_qr_image_url` VARCHAR(512) NULL,
    `bank_name` VARCHAR(120) NULL,
    `bank_account_number` VARCHAR(32) NULL,
    `bank_account_name` VARCHAR(200) NULL,
    `tax_id` VARCHAR(30) NULL,
    `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58',
    `staff_daily_pin_hash` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_shop_owner_idx`(`owner_id`),
    UNIQUE INDEX `sgt_shop_owner_trial_uniq`(`owner_id`, `trial_session_id`),
    UNIQUE INDEX `sgt_shop_slug_trial_uniq`(`slug`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_checkpoints` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `zone_label` VARCHAR(120) NULL,
    `building_label` VARCHAR(120) NULL,
    `floor_label` VARCHAR(60) NULL,
    `lat` DECIMAL(10, 7) NULL,
    `lng` DECIMAL(10, 7) NULL,
    `geofence_radius_m` INTEGER NOT NULL DEFAULT 80,
    `cover_image_url` VARCHAR(512) NULL,
    `qr_token` VARCHAR(64) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_cp_shop_active_idx`(`shop_id`, `is_active`),
    INDEX `sgt_cp_owner_trial_idx`(`owner_id`, `trial_session_id`),
    UNIQUE INDEX `sgt_cp_shop_slug_uniq`(`shop_id`, `slug`),
    UNIQUE INDEX `sgt_cp_shop_qr_uniq`(`shop_id`, `qr_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_checkpoint_videos` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `checkpoint_id` VARCHAR(191) NOT NULL,
    `youtube_url` VARCHAR(512) NOT NULL,
    `title` VARCHAR(200) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_cp_video_cp_idx`(`checkpoint_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `route_mode` VARCHAR(24) NOT NULL DEFAULT 'FREE',
    `interval_minutes` INTEGER NOT NULL DEFAULT 120,
    `checkpoint_ids_json` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_sched_shop_active_idx`(`shop_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_staff` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `photo_url` VARCHAR(512) NULL,
    `pin_hash` VARCHAR(100) NULL,
    `work_start_hm` VARCHAR(5) NULL,
    `work_end_hm` VARCHAR(5) NULL,
    `wage_baht_per_shift` INTEGER NOT NULL DEFAULT 0,
    `ot_baht_per_hour` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_staff_shop_active_idx`(`shop_id`, `is_active`),
    INDEX `sgt_staff_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_shift_logs` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `staff_id` VARCHAR(191) NOT NULL,
    `shift_on` VARCHAR(10) NOT NULL,
    `check_in_at` DATETIME(3) NULL,
    `check_out_at` DATETIME(3) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_shift_shop_on_idx`(`shop_id`, `shift_on`),
    INDEX `sgt_shift_staff_idx`(`staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_tour_logs` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `checkpoint_id` VARCHAR(191) NOT NULL,
    `staff_id` VARCHAR(191) NULL,
    `schedule_id` VARCHAR(191) NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    `scanned_at` DATETIME(3) NULL,
    `scan_lat` DECIMAL(10, 7) NULL,
    `scan_lng` DECIMAL(10, 7) NULL,
    `photo_url` VARCHAR(512) NULL,
    `note` TEXT NULL,
    `scan_token` VARCHAR(64) NULL,
    `entry_on` VARCHAR(10) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_tour_shop_on_idx`(`shop_id`, `entry_on`),
    INDEX `sgt_tour_cp_idx`(`checkpoint_id`),
    INDEX `sgt_tour_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_incidents` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `checkpoint_id` VARCHAR(191) NULL,
    `staff_id` VARCHAR(191) NULL,
    `contact_id` VARCHAR(191) NULL,
    `kind` VARCHAR(24) NOT NULL DEFAULT 'ISSUE',
    `status` VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    `severity` VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    `title` VARCHAR(200) NOT NULL,
    `detail` TEXT NULL,
    `report_lat` DECIMAL(10, 7) NULL,
    `report_lng` DECIMAL(10, 7) NULL,
    `resolved_note` TEXT NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_inc_shop_status_idx`(`shop_id`, `status`),
    INDEX `sgt_inc_shop_kind_idx`(`shop_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_incident_images` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `incident_id` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(512) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sgt_inc_img_idx`(`incident_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_contacts` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `line_id` VARCHAR(120) NULL,
    `notify_webhook` VARCHAR(512) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_contact_shop_active_idx`(`shop_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_assets` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `kind` VARCHAR(24) NOT NULL DEFAULT 'OTHER',
    `asset_code` VARCHAR(64) NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'AVAILABLE',
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_asset_shop_idx`(`shop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_finance_categories` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `system_key` VARCHAR(32) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_fcat_shop_kind_idx`(`shop_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_guard_ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NULL,
    `staff_id` VARCHAR(191) NULL,
    `asset_id` VARCHAR(191) NULL,
    `kind` VARCHAR(16) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `entry_on` VARCHAR(10) NOT NULL,
    `payment_method` VARCHAR(24) NULL,
    `slip_image_url` VARCHAR(512) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sgt_ledger_shop_on_idx`(`shop_id`, `entry_on`),
    INDEX `sgt_ledger_staff_idx`(`staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `smart_guard_shops` ADD CONSTRAINT `smart_guard_shops_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_checkpoints` ADD CONSTRAINT `smart_guard_checkpoints_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_checkpoints` ADD CONSTRAINT `smart_guard_checkpoints_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_checkpoint_videos` ADD CONSTRAINT `smart_guard_checkpoint_videos_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_checkpoint_videos` ADD CONSTRAINT `smart_guard_checkpoint_videos_checkpoint_id_fkey` FOREIGN KEY (`checkpoint_id`) REFERENCES `smart_guard_checkpoints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_schedules` ADD CONSTRAINT `smart_guard_schedules_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_schedules` ADD CONSTRAINT `smart_guard_schedules_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_staff` ADD CONSTRAINT `smart_guard_staff_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_staff` ADD CONSTRAINT `smart_guard_staff_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_shift_logs` ADD CONSTRAINT `smart_guard_shift_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_shift_logs` ADD CONSTRAINT `smart_guard_shift_logs_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_shift_logs` ADD CONSTRAINT `smart_guard_shift_logs_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `smart_guard_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_tour_logs` ADD CONSTRAINT `smart_guard_tour_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_tour_logs` ADD CONSTRAINT `smart_guard_tour_logs_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_tour_logs` ADD CONSTRAINT `smart_guard_tour_logs_checkpoint_id_fkey` FOREIGN KEY (`checkpoint_id`) REFERENCES `smart_guard_checkpoints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_tour_logs` ADD CONSTRAINT `smart_guard_tour_logs_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `smart_guard_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `smart_guard_tour_logs` ADD CONSTRAINT `smart_guard_tour_logs_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `smart_guard_schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `smart_guard_incidents` ADD CONSTRAINT `smart_guard_incidents_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_incidents` ADD CONSTRAINT `smart_guard_incidents_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_incidents` ADD CONSTRAINT `smart_guard_incidents_checkpoint_id_fkey` FOREIGN KEY (`checkpoint_id`) REFERENCES `smart_guard_checkpoints`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `smart_guard_incidents` ADD CONSTRAINT `smart_guard_incidents_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `smart_guard_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `smart_guard_incidents` ADD CONSTRAINT `smart_guard_incidents_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `smart_guard_contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `smart_guard_incident_images` ADD CONSTRAINT `smart_guard_incident_images_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_incident_images` ADD CONSTRAINT `smart_guard_incident_images_incident_id_fkey` FOREIGN KEY (`incident_id`) REFERENCES `smart_guard_incidents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_contacts` ADD CONSTRAINT `smart_guard_contacts_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_contacts` ADD CONSTRAINT `smart_guard_contacts_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_assets` ADD CONSTRAINT `smart_guard_assets_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_assets` ADD CONSTRAINT `smart_guard_assets_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_finance_categories` ADD CONSTRAINT `smart_guard_finance_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_finance_categories` ADD CONSTRAINT `smart_guard_finance_categories_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_guard_ledger_entries` ADD CONSTRAINT `smart_guard_ledger_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_ledger_entries` ADD CONSTRAINT `smart_guard_ledger_entries_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `smart_guard_ledger_entries` ADD CONSTRAINT `smart_guard_ledger_entries_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `smart_guard_finance_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `smart_guard_ledger_entries` ADD CONSTRAINT `smart_guard_ledger_entries_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `smart_guard_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `smart_guard_ledger_entries` ADD CONSTRAINT `smart_guard_ledger_entries_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `smart_guard_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
