-- CreateTable
CREATE TABLE `module_try_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `module_slug` VARCHAR(191) NOT NULL,
    `event_type` ENUM('VIEW', 'TRY_CLICK') NOT NULL,
    `utm_source` VARCHAR(120) NULL,
    `utm_medium` VARCHAR(120) NULL,
    `utm_campaign` VARCHAR(120) NULL,
    `utm_content` VARCHAR(120) NULL,
    `utm_term` VARCHAR(120) NULL,
    `referrer_host` VARCHAR(255) NULL,
    `visitor_key` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `module_try_events_module_slug_created_at_idx`(`module_slug`, `created_at`),
    INDEX `module_try_events_event_type_created_at_idx`(`event_type`, `created_at`),
    INDEX `module_try_events_utm_campaign_created_at_idx`(`utm_campaign`, `created_at`),
    INDEX `module_try_events_created_at_idx`(`created_at`),
    INDEX `module_try_events_visitor_slug_type_at_idx`(`visitor_key`, `module_slug`, `event_type`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
