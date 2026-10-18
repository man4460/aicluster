-- แม่แบบจากแบบฟอร์มเปล่า (สถานีแก้เนื้อหาได้)
CREATE TABLE `smart_police_form_templates` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `blank_form_id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(200) NULL,
    `content_html` MEDIUMTEXT NULL,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spftpl_owner_form_uidx`(`owner_user_id`, `blank_form_id`),
    INDEX `spftpl_owner_active_idx`(`owner_user_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `smart_police_form_templates` ADD CONSTRAINT `smart_police_form_templates_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
