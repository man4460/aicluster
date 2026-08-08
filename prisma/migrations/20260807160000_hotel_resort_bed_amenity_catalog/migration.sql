-- Manageable bed types + amenity catalog per hotel owner
CREATE TABLE `hotel_resort_bed_types` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `hr_bed_owner_name_uq`(`owner_user_id`, `name`),
  INDEX `hr_bed_owner_sort_idx`(`owner_user_id`, `sort_order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `hotel_resort_bed_types`
  ADD CONSTRAINT `hotel_resort_bed_types_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `hotel_resort_amenities` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(40) NOT NULL,
  `label` VARCHAR(80) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `hr_amenity_owner_key_uq`(`owner_user_id`, `key`),
  UNIQUE INDEX `hr_amenity_owner_label_uq`(`owner_user_id`, `label`),
  INDEX `hr_amenity_owner_sort_idx`(`owner_user_id`, `sort_order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `hotel_resort_amenities`
  ADD CONSTRAINT `hotel_resort_amenities_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
