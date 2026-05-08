-- EduCare module: schools, classrooms, students, daily check records, settings

CREATE TABLE `educare_schools` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(40) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `edu_sch_owner_trial_name_uidx`(`owner_id`, `trial_session_id`, `name`),
    INDEX `edu_sch_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `educare_classrooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `school_id` INTEGER NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `grade` VARCHAR(40) NULL,
    `level` VARCHAR(40) NULL,
    `homeroom_teacher_name` VARCHAR(120) NULL,
    `homeroom_teacher_phone` VARCHAR(40) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `edu_cls_owner_trial_school_sort_idx`(`owner_id`, `trial_session_id`, `school_id`, `sort_order`),
    INDEX `edu_cls_school_idx`(`school_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `educare_students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `classroom_id` INTEGER NOT NULL,
    `student_no` VARCHAR(20) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `nickname` VARCHAR(60) NULL,
    `gender` VARCHAR(2) NULL,
    `birthdate` DATE NULL,
    `photo_url` VARCHAR(512) NULL,
    `parent_name` VARCHAR(120) NULL,
    `parent_phone` VARCHAR(40) NULL,
    `address` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `edu_stu_owner_trial_room_no_uidx`(`owner_id`, `trial_session_id`, `classroom_id`, `student_no`),
    INDEX `edu_stu_owner_trial_room_idx`(`owner_id`, `trial_session_id`, `classroom_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `educare_check_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `student_id` INTEGER NOT NULL,
    `classroom_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `feature` ENUM('ASSEMBLY','TIDINESS','CLASS_ATTENDANCE','MEAL','BRUSHING','MILK') NOT NULL,
    `status` ENUM('PRESENT','LATE','ABSENT','EXCUSED','PASS','FAIL','DONE','PARTIAL','NOT_DONE','NA') NOT NULL,
    `meta` JSON NULL,
    `note` TEXT NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `edu_rec_student_date_feature_uidx`(`student_id`, `date`, `feature`),
    INDEX `edu_rec_owner_trial_date_idx`(`owner_id`, `trial_session_id`, `date`),
    INDEX `edu_rec_classroom_date_idx`(`classroom_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `educare_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `school_name` VARCHAR(120) NULL,
    `school_address` TEXT NULL,
    `school_phone` VARCHAR(40) NULL,
    `assembly_time` VARCHAR(5) NOT NULL DEFAULT '08:00',
    `tidiness_time` VARCHAR(5) NOT NULL DEFAULT '08:15',
    `milk_time` VARCHAR(5) NOT NULL DEFAULT '09:30',
    `meal_time` VARCHAR(5) NOT NULL DEFAULT '11:30',
    `brushing_time` VARCHAR(5) NOT NULL DEFAULT '12:30',
    `notify_absent_enabled` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `edu_set_owner_trial_uidx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `educare_schools` ADD CONSTRAINT `educare_schools_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `educare_classrooms` ADD CONSTRAINT `educare_classrooms_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `educare_classrooms` ADD CONSTRAINT `educare_classrooms_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `educare_schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `educare_students` ADD CONSTRAINT `educare_students_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `educare_students` ADD CONSTRAINT `educare_students_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `educare_classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `educare_check_records` ADD CONSTRAINT `educare_check_records_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `educare_check_records` ADD CONSTRAINT `educare_check_records_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `educare_students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `educare_check_records` ADD CONSTRAINT `educare_check_records_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `educare_classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `educare_settings` ADD CONSTRAINT `educare_settings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
