-- CreateTable
CREATE TABLE IF NOT EXISTS `car_wash_staff_links` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `token_hash` VARCHAR(128) NOT NULL,
    `token_cipher` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `car_wash_staff_link_owner_idx`(`owner_id`),
    UNIQUE INDEX `car_wash_staff_link_owner_trial_uniq`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `car_wash_staff_links`
  ADD CONSTRAINT `car_wash_staff_links_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
