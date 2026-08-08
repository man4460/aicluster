-- AlterTable
ALTER TABLE `hotel_resort_profiles`
  ADD COLUMN `address` TEXT NULL,
  ADD COLUMN `line_id` VARCHAR(120) NULL,
  ADD COLUMN `facebook_url` VARCHAR(512) NULL,
  ADD COLUMN `map_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_booking_payment_mode` VARCHAR(16) NOT NULL DEFAULT 'NONE',
  ADD COLUMN `deposit_amount_baht` INTEGER NULL;

-- AlterTable
ALTER TABLE `hotel_resort_bookings`
  ADD COLUMN `deposit_amount_baht` INTEGER NULL;

-- CreateTable
CREATE TABLE `hotel_resort_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `guest_name` VARCHAR(120) NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `comment` VARCHAR(800) NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hr_review_owner_pub_sort_idx`(`owner_user_id`, `trial_session_id`, `is_published`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hotel_resort_reviews` ADD CONSTRAINT `hotel_resort_reviews_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
