-- Pro Resume — ทักษะพิเศษ (ความสามารถพิเศษที่นำเสนอ)
CREATE TABLE `resume_skills` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `level` VARCHAR(80) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `resume_skill_profile_order_idx`(`profile_id`, `order_index`),
    INDEX `resume_skill_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `resume_skills` ADD CONSTRAINT `resume_skills_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_skills` ADD CONSTRAINT `resume_skills_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `resume_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
