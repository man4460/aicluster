-- LMS course purchases (learner buy + slip review)
CREATE TABLE `lms_course_purchases` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `learner_id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `pay_method` ENUM('PROMPTPAY', 'TRANSFER') NOT NULL,
    `slip_url` VARCHAR(512) NULL,
    `status` ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING_REVIEW',
    `reviewer_note` VARCHAR(500) NOT NULL DEFAULT '',
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lms_purchase_owner_trial_status_idx`(`owner_id`, `trial_session_id`, `status`),
    INDEX `lms_purchase_profile_status_idx`(`profile_id`, `status`),
    INDEX `lms_purchase_learner_course_idx`(`learner_id`, `course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `lms_course_purchases` ADD CONSTRAINT `lms_course_purchases_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_course_purchases` ADD CONSTRAINT `lms_course_purchases_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `lms_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_course_purchases` ADD CONSTRAINT `lms_course_purchases_learner_id_fkey` FOREIGN KEY (`learner_id`) REFERENCES `lms_learners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_course_purchases` ADD CONSTRAINT `lms_course_purchases_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `lms_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
