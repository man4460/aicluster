-- LMS & Online Course System
CREATE TABLE `lms_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `slug` VARCHAR(80) NOT NULL,
    `display_name` VARCHAR(200) NOT NULL,
    `logo_url` VARCHAR(512) NULL,
    `tagline` VARCHAR(300) NULL,
    `address` TEXT NULL,
    `contact_phone` VARCHAR(32) NULL,
    `contact_line` VARCHAR(120) NULL,
    `cert_signer_name` VARCHAR(160) NOT NULL DEFAULT '',
    `cert_signature_url` VARCHAR(512) NULL,
    `cert_template_note` TEXT NOT NULL,
    `prompt_pay_phone` VARCHAR(20) NULL,
    `prompt_pay_qr_image_url` VARCHAR(512) NULL,
    `bank_name` VARCHAR(120) NULL,
    `bank_account_number` VARCHAR(32) NULL,
    `bank_account_name` VARCHAR(200) NULL,
    `tax_id` VARCHAR(30) NULL,
    `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lms_profile_owner_trial_uniq`(`owner_id`, `trial_session_id`),
    UNIQUE INDEX `lms_profile_slug_trial_uniq`(`slug`, `trial_session_id`),
    INDEX `lms_profile_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lms_courses` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `cover_image_url` VARCHAR(512) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `price_baht` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lms_course_owner_trial_idx`(`owner_id`, `trial_session_id`),
    INDEX `lms_course_profile_status_idx`(`profile_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lms_lessons` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `course_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `youtube_url` VARCHAR(512) NOT NULL,
    `duration_sec` INTEGER NOT NULL DEFAULT 0,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lms_lesson_course_order_idx`(`course_id`, `order_index`),
    INDEX `lms_lesson_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lms_learners` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(80) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(160) NOT NULL,
    `email` VARCHAR(200) NOT NULL DEFAULT '',
    `phone` VARCHAR(32) NOT NULL DEFAULT '',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lms_learner_profile_username_uniq`(`profile_id`, `username`),
    INDEX `lms_learner_owner_trial_idx`(`owner_id`, `trial_session_id`),
    INDEX `lms_learner_profile_status_idx`(`profile_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lms_enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `learner_id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `progress_percent` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ENROLLED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'ENROLLED',
    `exam_score_percent` INTEGER NULL,
    `enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lms_enrollment_learner_course_uniq`(`learner_id`, `course_id`),
    INDEX `lms_enrollment_owner_trial_idx`(`owner_id`, `trial_session_id`),
    INDEX `lms_enrollment_course_status_idx`(`course_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lms_lesson_progresses` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `learner_id` VARCHAR(191) NOT NULL,
    `lesson_id` VARCHAR(191) NOT NULL,
    `watched_percent` INTEGER NOT NULL DEFAULT 0,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lms_lesson_progress_learner_lesson_uniq`(`learner_id`, `lesson_id`),
    INDEX `lms_lesson_progress_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lms_exams` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `course_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL DEFAULT 'แบบทดสอบท้ายคอร์ส',
    `passing_score_percent` INTEGER NOT NULL DEFAULT 70,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lms_exams_course_id_key`(`course_id`),
    INDEX `lms_exam_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lms_questions` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `exam_id` VARCHAR(191) NOT NULL,
    `question_text` TEXT NOT NULL,
    `choices_json` TEXT NOT NULL,
    `correct_answer` VARCHAR(200) NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lms_question_exam_order_idx`(`exam_id`, `order_index`),
    INDEX `lms_question_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lms_certificates` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `learner_id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `issue_date` DATETIME(3) NOT NULL,
    `cert_code` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `lms_cert_learner_course_uniq`(`learner_id`, `course_id`),
    UNIQUE INDEX `lms_cert_owner_trial_code_uniq`(`owner_id`, `trial_session_id`, `cert_code`),
    INDEX `lms_cert_course_idx`(`course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lms_finance_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `profile_id` VARCHAR(191) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `amount_baht` INTEGER NOT NULL,
    `transacted_at` DATETIME(3) NOT NULL,
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `slip_url` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lms_fin_owner_trial_date_idx`(`owner_id`, `trial_session_id`, `transacted_at`),
    INDEX `lms_fin_profile_type_idx`(`profile_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `lms_profiles` ADD CONSTRAINT `lms_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_courses` ADD CONSTRAINT `lms_courses_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_courses` ADD CONSTRAINT `lms_courses_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `lms_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_lessons` ADD CONSTRAINT `lms_lessons_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_lessons` ADD CONSTRAINT `lms_lessons_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `lms_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_learners` ADD CONSTRAINT `lms_learners_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_learners` ADD CONSTRAINT `lms_learners_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `lms_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_enrollments` ADD CONSTRAINT `lms_enrollments_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_enrollments` ADD CONSTRAINT `lms_enrollments_learner_id_fkey` FOREIGN KEY (`learner_id`) REFERENCES `lms_learners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_enrollments` ADD CONSTRAINT `lms_enrollments_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `lms_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_lesson_progresses` ADD CONSTRAINT `lms_lesson_progresses_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_lesson_progresses` ADD CONSTRAINT `lms_lesson_progresses_learner_id_fkey` FOREIGN KEY (`learner_id`) REFERENCES `lms_learners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_lesson_progresses` ADD CONSTRAINT `lms_lesson_progresses_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lms_lessons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_exams` ADD CONSTRAINT `lms_exams_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_exams` ADD CONSTRAINT `lms_exams_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `lms_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_questions` ADD CONSTRAINT `lms_questions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_questions` ADD CONSTRAINT `lms_questions_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `lms_exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_certificates` ADD CONSTRAINT `lms_certificates_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_certificates` ADD CONSTRAINT `lms_certificates_learner_id_fkey` FOREIGN KEY (`learner_id`) REFERENCES `lms_learners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_certificates` ADD CONSTRAINT `lms_certificates_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `lms_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_finance_transactions` ADD CONSTRAINT `lms_finance_transactions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lms_finance_transactions` ADD CONSTRAINT `lms_finance_transactions_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `lms_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
