-- AlterTable plan_feature_policy: multi-kitchen gate (299+)
ALTER TABLE `plan_feature_policy`
  ADD COLUMN `multi_kitchen_gate_enabled` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable building_pos_kitchen_departments
CREATE TABLE `building_pos_kitchen_departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(160) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 100,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bpos_kdept_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
    INDEX `bpos_kdept_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable building_pos_menu_items
ALTER TABLE `building_pos_menu_items`
  ADD COLUMN `kitchen_department_id` INTEGER NULL;

CREATE INDEX `bpos_menu_owner_trial_kdept_idx` ON `building_pos_menu_items`(`owner_id`, `trial_session_id`, `kitchen_department_id`);

ALTER TABLE `building_pos_kitchen_departments`
  ADD CONSTRAINT `building_pos_kitchen_departments_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `building_pos_menu_items`
  ADD CONSTRAINT `building_pos_menu_items_kitchen_department_id_fkey`
  FOREIGN KEY (`kitchen_department_id`) REFERENCES `building_pos_kitchen_departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
