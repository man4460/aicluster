-- Smart Police: charge catalog (คลังข้อหา)

CREATE TABLE `smart_police_charges` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NULL,
    `category` VARCHAR(80) NOT NULL DEFAULT 'ทั่วไป',
    `charge_text` TEXT NOT NULL,
    `law_refs` TEXT NULL,
    `keywords` VARCHAR(255) NULL,
    `is_builtin` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `spcharge_owner_active_cat_idx`(`owner_user_id`, `is_active`, `category`),
    INDEX `spcharge_builtin_active_idx`(`is_builtin`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `smart_police_charges`
  ADD CONSTRAINT `smart_police_charges_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
