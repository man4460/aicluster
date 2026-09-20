-- AlterTable
ALTER TABLE `smart_guard_shops`
  ADD COLUMN `attendance_link_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `attendance_branch_id` INTEGER NULL,
  ADD COLUMN `attendance_location_id` INTEGER NULL,
  ADD COLUMN `attendance_require_match` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `smart_guard_attendance_staff_links` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `shop_id` VARCHAR(191) NOT NULL,
    `guard_staff_id` VARCHAR(191) NOT NULL,
    `roster_entry_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sgt_att_link_shop_staff_uniq`(`shop_id`, `guard_staff_id`),
    UNIQUE INDEX `sgt_att_link_shop_roster_uniq`(`shop_id`, `roster_entry_id`),
    INDEX `sgt_att_link_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `smart_guard_attendance_staff_links` ADD CONSTRAINT `smart_guard_attendance_staff_links_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `smart_guard_attendance_staff_links` ADD CONSTRAINT `smart_guard_attendance_staff_links_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `smart_guard_attendance_staff_links` ADD CONSTRAINT `smart_guard_attendance_staff_links_guard_staff_id_fkey` FOREIGN KEY (`guard_staff_id`) REFERENCES `smart_guard_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `smart_guard_attendance_staff_links` ADD CONSTRAINT `smart_guard_attendance_staff_links_roster_entry_id_fkey` FOREIGN KEY (`roster_entry_id`) REFERENCES `attendance_roster_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
