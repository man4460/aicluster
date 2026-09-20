-- จุดรักษาการณ์ · แม่แบบกะ · จัดเวร · มอบหมายสายตรวจ · สรุปค่าแรงรายชั่วโมง
ALTER TABLE `smart_guard_shops`
  ADD COLUMN `weekly_normal_cap_minutes` INT NOT NULL DEFAULT 2880,
  ADD COLUMN `daily_normal_cap_minutes` INT NOT NULL DEFAULT 480,
  ADD COLUMN `ot_multiplier` DECIMAL(4, 2) NOT NULL DEFAULT 1.50,
  ADD COLUMN `holiday_multiplier` DECIMAL(4, 2) NOT NULL DEFAULT 2.00,
  ADD COLUMN `holiday_ot_multiplier` DECIMAL(4, 2) NOT NULL DEFAULT 3.00;

ALTER TABLE `smart_guard_staff`
  ADD COLUMN `hourly_rate_baht` INT NOT NULL DEFAULT 0;

CREATE TABLE `smart_guard_posts` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `shop_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(40) NULL,
  `zone_label` VARCHAR(120) NULL,
  `building_label` VARCHAR(120) NULL,
  `linked_checkpoint_ids_json` TEXT NOT NULL DEFAULT ('[]'),
  `required_staff_per_shift` INT NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `sgt_post_shop_code_uniq`(`shop_id`, `code`),
  INDEX `sgt_post_shop_active_idx`(`shop_id`, `is_active`),
  INDEX `sgt_post_owner_trial_idx`(`owner_id`, `trial_session_id`),
  CONSTRAINT `smart_guard_posts_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_posts_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_guard_duty_templates` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `shop_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `start_hm` VARCHAR(5) NOT NULL,
  `end_hm` VARCHAR(5) NOT NULL,
  `planned_minutes` INT NOT NULL,
  `break_minutes` INT NOT NULL DEFAULT 0,
  `normal_cap_minutes` INT NOT NULL DEFAULT 480,
  `role_mask` VARCHAR(16) NOT NULL DEFAULT 'BOTH',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `sgt_duty_tpl_shop_active_idx`(`shop_id`, `is_active`),
  CONSTRAINT `smart_guard_duty_templates_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_duty_templates_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_guard_post_duties` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `shop_id` VARCHAR(191) NOT NULL,
  `duty_on` VARCHAR(10) NOT NULL,
  `post_id` VARCHAR(191) NOT NULL,
  `staff_id` VARCHAR(191) NOT NULL,
  `template_id` VARCHAR(191) NOT NULL,
  `status` VARCHAR(24) NOT NULL DEFAULT 'PLANNED',
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `sgt_post_duty_uniq`(`shop_id`, `duty_on`, `post_id`, `staff_id`),
  INDEX `sgt_post_duty_shop_on_idx`(`shop_id`, `duty_on`),
  INDEX `sgt_post_duty_staff_on_idx`(`staff_id`, `duty_on`),
  CONSTRAINT `smart_guard_post_duties_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_post_duties_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_post_duties_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `smart_guard_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_post_duties_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `smart_guard_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_post_duties_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `smart_guard_duty_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `smart_guard_tour_assignments` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `shop_id` VARCHAR(191) NOT NULL,
  `duty_on` VARCHAR(10) NOT NULL,
  `schedule_id` VARCHAR(191) NOT NULL,
  `staff_id` VARCHAR(191) NOT NULL,
  `template_id` VARCHAR(191) NULL,
  `post_duty_id` VARCHAR(191) NULL,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `sgt_tour_assign_uniq`(`shop_id`, `duty_on`, `schedule_id`, `staff_id`),
  INDEX `sgt_tour_assign_shop_on_idx`(`shop_id`, `duty_on`),
  INDEX `sgt_tour_assign_post_duty_idx`(`post_duty_id`),
  CONSTRAINT `smart_guard_tour_assignments_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_tour_assignments_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_tour_assignments_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `smart_guard_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_tour_assignments_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `smart_guard_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_tour_assignments_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `smart_guard_duty_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_tour_assignments_post_duty_id_fkey` FOREIGN KEY (`post_duty_id`) REFERENCES `smart_guard_post_duties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `smart_guard_shift_logs`
  ADD COLUMN `break_minutes` INT NOT NULL DEFAULT 0,
  ADD COLUMN `template_id` VARCHAR(191) NULL,
  ADD COLUMN `post_duty_id` VARCHAR(191) NULL;

CREATE INDEX `sgt_shift_post_duty_idx` ON `smart_guard_shift_logs`(`post_duty_id`);

ALTER TABLE `smart_guard_shift_logs`
  ADD CONSTRAINT `smart_guard_shift_logs_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `smart_guard_duty_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `smart_guard_shift_logs_post_duty_id_fkey` FOREIGN KEY (`post_duty_id`) REFERENCES `smart_guard_post_duties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `smart_guard_work_spans` (
  `id` VARCHAR(191) NOT NULL,
  `owner_id` VARCHAR(191) NOT NULL,
  `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
  `shop_id` VARCHAR(191) NOT NULL,
  `staff_id` VARCHAR(191) NOT NULL,
  `shift_log_id` VARCHAR(191) NOT NULL,
  `work_on` VARCHAR(10) NOT NULL,
  `clock_minutes` INT NOT NULL DEFAULT 0,
  `normal_minutes` INT NOT NULL DEFAULT 0,
  `ot_minutes` INT NOT NULL DEFAULT 0,
  `holiday_kind` VARCHAR(24) NOT NULL DEFAULT 'NONE',
  `wage_normal_baht` INT NOT NULL DEFAULT 0,
  `wage_ot_baht` INT NOT NULL DEFAULT 0,
  `wage_holiday_baht` INT NOT NULL DEFAULT 0,
  `total_baht` INT NOT NULL DEFAULT 0,
  `flags_json` TEXT NOT NULL DEFAULT ('[]'),
  `locked` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `sgt_work_span_shift_uniq`(`shift_log_id`),
  INDEX `sgt_work_span_shop_on_idx`(`shop_id`, `work_on`),
  INDEX `sgt_work_span_staff_on_idx`(`staff_id`, `work_on`),
  CONSTRAINT `smart_guard_work_spans_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_work_spans_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `smart_guard_shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_work_spans_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `smart_guard_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `smart_guard_work_spans_shift_log_id_fkey` FOREIGN KEY (`shift_log_id`) REFERENCES `smart_guard_shift_logs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
