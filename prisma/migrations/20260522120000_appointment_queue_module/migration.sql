-- Appointment Queue module (จองคิวอัจฉริยะ)

CREATE TABLE `appointment_queue_shop_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `display_name` VARCHAR(200) NULL,
    `logo_url` VARCHAR(512) NULL,
    `address` TEXT NULL,
    `contact_phone` VARCHAR(32) NULL,
    `tagline` VARCHAR(300) NULL,
    `public_booking_enabled` BOOLEAN NOT NULL DEFAULT true,
    `deposit_required` BOOLEAN NOT NULL DEFAULT false,
    `deposit_amount_baht` DECIMAL(10, 2) NULL,
    `prompt_pay_id` VARCHAR(32) NULL,
    `prompt_pay_name` VARCHAR(120) NULL,
    `bank_account_note` VARCHAR(500) NULL,
    `default_slot_minutes` INTEGER NOT NULL DEFAULT 60,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `appointment_queue_shop_profiles_owner_id_trial_session_id_key`(`owner_id`, `trial_session_id`),
    INDEX `appointment_queue_shop_profiles_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `appointment_queue_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(160) NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 60,
    `price_baht` DECIMAL(10, 2) NULL,
    `deposit_baht` DECIMAL(10, 2) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `aq_svc_owner_trial_active_idx`(`owner_id`, `trial_session_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `appointment_queue_staff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `photo_url` VARCHAR(512) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `aq_staff_owner_trial_active_idx`(`owner_id`, `trial_session_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `appointment_queue_day_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `schedule_date` DATE NOT NULL,
    `open_time` VARCHAR(5) NOT NULL,
    `close_time` VARCHAR(5) NOT NULL,
    `slot_minutes` INTEGER NOT NULL DEFAULT 60,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `appt_queue_sched_owner_trial_date_uq`(`owner_id`, `trial_session_id`, `schedule_date`),
    INDEX `aq_sched_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `appointment_queue_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `service_id` INTEGER NOT NULL,
    `staff_id` INTEGER NULL,
    `phone` VARCHAR(20) NOT NULL,
    `customer_name` VARCHAR(120) NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 60,
    `status` ENUM('PENDING_DEPOSIT', 'CONFIRMED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING_DEPOSIT',
    `deposit_amount_baht` DECIMAL(10, 2) NULL,
    `deposit_slip_url` VARCHAR(512) NULL,
    `deposit_paid_at` DATETIME(3) NULL,
    `note` VARCHAR(500) NULL,
    `board_sort` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `aq_book_owner_sched_idx`(`owner_id`, `scheduled_at`),
    INDEX `aq_book_owner_trial_status_idx`(`owner_id`, `trial_session_id`, `status`),
    INDEX `aq_book_owner_trial_sched_idx`(`owner_id`, `trial_session_id`, `scheduled_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `appointment_queue_shop_profiles` ADD CONSTRAINT `appointment_queue_shop_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `appointment_queue_services` ADD CONSTRAINT `appointment_queue_services_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `appointment_queue_staff` ADD CONSTRAINT `appointment_queue_staff_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `appointment_queue_day_schedules` ADD CONSTRAINT `appointment_queue_day_schedules_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `appointment_queue_bookings` ADD CONSTRAINT `appointment_queue_bookings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `appointment_queue_bookings` ADD CONSTRAINT `appointment_queue_bookings_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `appointment_queue_services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `appointment_queue_bookings` ADD CONSTRAINT `appointment_queue_bookings_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `appointment_queue_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
