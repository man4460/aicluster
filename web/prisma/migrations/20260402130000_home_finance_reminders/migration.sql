CREATE TABLE `home_finance_reminders` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `due_date` DATE NOT NULL,
  `note` VARCHAR(400) NULL,
  `is_done` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `home_finance_reminders_owner_id_due_date_is_done_idx`(`owner_id`, `due_date`, `is_done`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `home_finance_reminders`
  ADD CONSTRAINT `home_finance_reminders_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
