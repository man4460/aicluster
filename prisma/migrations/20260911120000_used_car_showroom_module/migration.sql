-- Used car showroom module (group 1)
INSERT INTO `module_list` (
  `id`,
  `slug`,
  `title`,
  `description`,
  `group_id`,
  `sort_order`,
  `is_active`,
  `created_at`,
  `updated_at`
)
SELECT
  'used-car-showroom-module',
  'used-car-showroom',
  'โชว์รูมรถมือสอง',
  'กลุ่ม 1 (Basic) — รับซื้อ สต็อก จอง ไฟแนนซ์ กำไรรายคัน และเว็บ /car/[slug]',
  1,
  38,
  TRUE,
  NOW(3),
  NOW(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `module_list` WHERE `slug` = 'used-car-showroom'
);

CREATE TABLE IF NOT EXISTS `used_car_showroom_shops` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `slug` VARCHAR(80) NOT NULL,
    `display_name` VARCHAR(200) NOT NULL,
    `logo_url` VARCHAR(512) NULL,
    `tagline` VARCHAR(300) NULL,
    `address` TEXT NULL,
    `contact_phone` VARCHAR(32) NULL,
    `contact_line` VARCHAR(120) NULL,
    `facebook_url` VARCHAR(512) NULL,
    `map_url` VARCHAR(512) NULL,
    `open_time_hm` VARCHAR(5) NULL,
    `close_time_hm` VARCHAR(5) NULL,
    `portal_banner_url` VARCHAR(512) NULL,
    `portal_gallery_json` TEXT NOT NULL,
    `portal_enabled` BOOLEAN NOT NULL DEFAULT true,
    `portal_booking_payment_mode` VARCHAR(16) NOT NULL DEFAULT 'DEPOSIT',
    `deposit_amount_baht` INTEGER NOT NULL DEFAULT 5000,
    `prompt_pay_phone` VARCHAR(20) NULL,
    `prompt_pay_qr_image_url` VARCHAR(512) NULL,
    `bank_name` VARCHAR(120) NULL,
    `bank_account_number` VARCHAR(32) NULL,
    `bank_account_name` VARCHAR(200) NULL,
    `tax_id` VARCHAR(30) NULL,
    `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ucs_shop_owner_trial_uniq`(`owner_id`, `trial_session_id`),
    UNIQUE INDEX `ucs_shop_slug_trial_uniq`(`slug`, `trial_session_id`),
    INDEX `ucs_shop_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'PREP',
    `brand` VARCHAR(80) NOT NULL,
    `model` VARCHAR(120) NOT NULL,
    `year` INTEGER NULL,
    `color` VARCHAR(60) NULL,
    `mileage_km` INTEGER NULL,
    `transmission` VARCHAR(24) NULL,
    `fuel_type` VARCHAR(24) NULL,
    `body_type` VARCHAR(24) NULL,
    `plate_number` VARCHAR(32) NULL,
    `vin` VARCHAR(64) NULL,
    `engine_number` VARCHAR(64) NULL,
    `has_registration_book` BOOLEAN NOT NULL DEFAULT false,
    `purchase_cost_baht` INTEGER NOT NULL DEFAULT 0,
    `asking_price_baht` INTEGER NOT NULL DEFAULT 0,
    `cover_image_url` VARCHAR(512) NULL,
    `description` TEXT NULL,
    `note` TEXT NULL,
    `purchased_at` DATETIME(3) NULL,
    `sold_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_vehicle_shop_status_idx`(`shop_id`, `status`),
    INDEX `ucs_vehicle_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_vehicle_images` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `vehicle_id` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(512) NOT NULL,
    `is_cover` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ucs_vimg_vehicle_sort_idx`(`vehicle_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_vehicle_videos` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `vehicle_id` VARCHAR(191) NOT NULL,
    `youtube_url` VARCHAR(512) NOT NULL,
    `title` VARCHAR(200) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ucs_vvid_vehicle_sort_idx`(`vehicle_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_vehicle_documents` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `vehicle_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `file_url` VARCHAR(512) NOT NULL,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ucs_vdoc_vehicle_idx`(`vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_cost_lines` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `vehicle_id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(24) NOT NULL,
    `label` VARCHAR(200) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `slip_image_url` VARCHAR(512) NULL,
    `spent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ucs_cost_vehicle_spent_idx`(`vehicle_id`, `spent_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_promotions` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `kind` VARCHAR(16) NOT NULL DEFAULT 'AMOUNT',
    `value_baht` INTEGER NOT NULL DEFAULT 0,
    `value_percent` INTEGER NOT NULL DEFAULT 0,
    `gift_label` VARCHAR(200) NULL,
    `starts_on` VARCHAR(10) NOT NULL,
    `ends_on` VARCHAR(10) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_promo_shop_active_idx`(`shop_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_customers` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `line_id` VARCHAR(120) NULL,
    `email` VARCHAR(200) NULL,
    `address` TEXT NULL,
    `national_id` VARCHAR(20) NULL,
    `tax_id` VARCHAR(30) NULL,
    `tax_name` VARCHAR(200) NULL,
    `tax_address` TEXT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_customer_shop_phone_idx`(`shop_id`, `phone`),
    INDEX `ucs_customer_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_customer_documents` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `customer_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `file_url` VARCHAR(512) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ucs_cdoc_customer_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_staff` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `role` VARCHAR(24) NOT NULL DEFAULT 'SALES',
    `commission_percent` INTEGER NOT NULL DEFAULT 0,
    `bonus_note` VARCHAR(500) NULL,
    `started_on` VARCHAR(10) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_staff_shop_active_idx`(`shop_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_leads` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `customer_id` VARCHAR(191) NULL,
    `vehicle_id` VARCHAR(191) NULL,
    `staff_id` VARCHAR(191) NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `source` VARCHAR(24) NOT NULL DEFAULT 'OTHER',
    `status` VARCHAR(24) NOT NULL DEFAULT 'NEW',
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_lead_shop_status_idx`(`shop_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_reservations` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `customer_id` VARCHAR(191) NULL,
    `staff_id` VARCHAR(191) NULL,
    `source` VARCHAR(16) NOT NULL DEFAULT 'STAFF',
    `customer_name` VARCHAR(200) NOT NULL,
    `customer_phone` VARCHAR(32) NOT NULL,
    `deposit_baht` INTEGER NOT NULL DEFAULT 0,
    `payment_method` VARCHAR(24) NOT NULL DEFAULT 'NONE',
    `slip_image_url` VARCHAR(512) NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    `expires_on` VARCHAR(10) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_res_shop_status_idx`(`shop_id`, `status`),
    INDEX `ucs_res_vehicle_idx`(`vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_sales` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `customer_id` VARCHAR(191) NULL,
    `reservation_id` VARCHAR(191) NULL,
    `staff_id` VARCHAR(191) NULL,
    `sale_price_baht` INTEGER NOT NULL,
    `discount_baht` INTEGER NOT NULL DEFAULT 0,
    `tax_invoice_enabled` BOOLEAN NOT NULL DEFAULT false,
    `payment_method` VARCHAR(24) NOT NULL,
    `slip_image_url` VARCHAR(512) NULL,
    `sold_on` VARCHAR(10) NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_sale_shop_sold_idx`(`shop_id`, `sold_on`),
    INDEX `ucs_sale_vehicle_idx`(`vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_finance_companies` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `contact_name` VARCHAR(120) NULL,
    `contact_phone` VARCHAR(32) NULL,
    `note` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_finco_shop_active_idx`(`shop_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_finance_cases` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `sale_id` VARCHAR(191) NULL,
    `customer_id` VARCHAR(191) NULL,
    `company_id` VARCHAR(191) NULL,
    `financed_amount_baht` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(24) NOT NULL DEFAULT 'SUBMITTED',
    `commission_baht` INTEGER NOT NULL DEFAULT 0,
    `commission_paid` BOOLEAN NOT NULL DEFAULT false,
    `insurance_company` VARCHAR(200) NULL,
    `sign_on` VARCHAR(10) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_fincase_shop_status_idx`(`shop_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_appointments` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NULL,
    `customer_id` VARCHAR(191) NULL,
    `staff_id` VARCHAR(191) NULL,
    `kind` VARCHAR(24) NOT NULL DEFAULT 'VIEW',
    `customer_name` VARCHAR(200) NOT NULL,
    `customer_phone` VARCHAR(32) NOT NULL,
    `appointment_on` VARCHAR(10) NOT NULL,
    `appointment_hm` VARCHAR(5) NOT NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'SCHEDULED',
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_appt_shop_on_idx`(`shop_id`, `appointment_on`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_finance_categories` (
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
    INDEX `ucs_fcat_shop_kind_idx`(`shop_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_car_ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NULL,
    `vehicle_id` VARCHAR(191) NULL,
    `sale_id` VARCHAR(191) NULL,
    `kind` VARCHAR(16) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `entry_on` VARCHAR(10) NOT NULL,
    `payment_method` VARCHAR(24) NULL,
    `slip_image_url` VARCHAR(512) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `ucs_ledger_shop_on_idx`(`shop_id`, `entry_on`),
    INDEX `ucs_ledger_vehicle_idx`(`vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `used_car_showroom_shops` ADD CONSTRAINT `used_car_showroom_shops_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_vehicles` ADD CONSTRAINT `used_car_vehicles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_vehicles` ADD CONSTRAINT `used_car_vehicles_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_vehicle_images` ADD CONSTRAINT `used_car_vehicle_images_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_vehicle_images` ADD CONSTRAINT `used_car_vehicle_images_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_vehicle_videos` ADD CONSTRAINT `used_car_vehicle_videos_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_vehicle_videos` ADD CONSTRAINT `used_car_vehicle_videos_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_vehicle_documents` ADD CONSTRAINT `used_car_vehicle_documents_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_vehicle_documents` ADD CONSTRAINT `used_car_vehicle_documents_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_cost_lines` ADD CONSTRAINT `used_car_cost_lines_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_cost_lines` ADD CONSTRAINT `used_car_cost_lines_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_promotions` ADD CONSTRAINT `used_car_promotions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_promotions` ADD CONSTRAINT `used_car_promotions_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_promotions` ADD CONSTRAINT `used_car_promotions_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_customers` ADD CONSTRAINT `used_car_customers_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_customers` ADD CONSTRAINT `used_car_customers_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_customer_documents` ADD CONSTRAINT `used_car_customer_documents_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_customer_documents` ADD CONSTRAINT `used_car_customer_documents_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `used_car_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_staff` ADD CONSTRAINT `used_car_staff_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_staff` ADD CONSTRAINT `used_car_staff_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_leads` ADD CONSTRAINT `used_car_leads_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_leads` ADD CONSTRAINT `used_car_leads_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_leads` ADD CONSTRAINT `used_car_leads_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `used_car_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_leads` ADD CONSTRAINT `used_car_leads_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_leads` ADD CONSTRAINT `used_car_leads_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `used_car_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_reservations` ADD CONSTRAINT `used_car_reservations_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_reservations` ADD CONSTRAINT `used_car_reservations_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_reservations` ADD CONSTRAINT `used_car_reservations_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_reservations` ADD CONSTRAINT `used_car_reservations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `used_car_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_reservations` ADD CONSTRAINT `used_car_reservations_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `used_car_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_sales` ADD CONSTRAINT `used_car_sales_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_sales` ADD CONSTRAINT `used_car_sales_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_sales` ADD CONSTRAINT `used_car_sales_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_sales` ADD CONSTRAINT `used_car_sales_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `used_car_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_sales` ADD CONSTRAINT `used_car_sales_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `used_car_reservations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_sales` ADD CONSTRAINT `used_car_sales_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `used_car_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_companies` ADD CONSTRAINT `used_car_finance_companies_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_companies` ADD CONSTRAINT `used_car_finance_companies_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_cases` ADD CONSTRAINT `used_car_finance_cases_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_cases` ADD CONSTRAINT `used_car_finance_cases_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_cases` ADD CONSTRAINT `used_car_finance_cases_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_cases` ADD CONSTRAINT `used_car_finance_cases_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `used_car_sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_cases` ADD CONSTRAINT `used_car_finance_cases_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `used_car_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_cases` ADD CONSTRAINT `used_car_finance_cases_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `used_car_finance_companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_appointments` ADD CONSTRAINT `used_car_appointments_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_appointments` ADD CONSTRAINT `used_car_appointments_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_appointments` ADD CONSTRAINT `used_car_appointments_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_appointments` ADD CONSTRAINT `used_car_appointments_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `used_car_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_appointments` ADD CONSTRAINT `used_car_appointments_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `used_car_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_categories` ADD CONSTRAINT `used_car_finance_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_finance_categories` ADD CONSTRAINT `used_car_finance_categories_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_ledger_entries` ADD CONSTRAINT `used_car_ledger_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_ledger_entries` ADD CONSTRAINT `used_car_ledger_entries_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `used_car_showroom_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `used_car_ledger_entries` ADD CONSTRAINT `used_car_ledger_entries_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `used_car_finance_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_ledger_entries` ADD CONSTRAINT `used_car_ledger_entries_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `used_car_vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `used_car_ledger_entries` ADD CONSTRAINT `used_car_ledger_entries_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `used_car_sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
