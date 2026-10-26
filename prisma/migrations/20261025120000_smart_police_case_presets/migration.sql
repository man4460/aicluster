-- Smart Police: แม่แบบตั้งต้นคดี (case preset)
-- ที่มา: ฐานคดีเก่า 48 คดี → ประเภทคดี + ข้อหา → ข้อมูลตั้งต้น + ชุดเอกสาร

CREATE TABLE `smart_police_case_presets` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NULL,
    `key` VARCHAR(64) NOT NULL,
    `case_type` VARCHAR(80) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `charge_id` VARCHAR(191) NULL,
    `default_charge_text` TEXT NOT NULL,
    `default_law_refs` TEXT NULL,
    `default_court_type` VARCHAR(80) NULL,
    `default_custody_mode` ENUM('DETAIN_REMAND', 'NOT_ARRESTED', 'UNKNOWN', 'SURRENDER_RELEASE', 'SURRENDER_DETAIN', 'OTHER') NULL,
    `starter_fields_json` MEDIUMTEXT NOT NULL,
    `form_slugs` TEXT NOT NULL,
    `is_builtin` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sppreset_owner_key_uidx`(`owner_user_id`, `key`),
    INDEX `sppreset_type_active_idx`(`case_type`, `is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `smart_police_case_presets`
  ADD CONSTRAINT `smart_police_case_presets_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `smart_police_case_presets`
  ADD CONSTRAINT `smart_police_case_presets_charge_id_fkey`
  FOREIGN KEY (`charge_id`) REFERENCES `smart_police_charges`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
