-- CreateTable
CREATE TABLE `user_module_plans` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `module_slug` VARCHAR(64) NOT NULL,
    `kind` ENUM('DAILY', 'MONTHLY_199') NOT NULL DEFAULT 'MONTHLY_199',
    `last_billing_month` VARCHAR(7) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ump_user_slug_uidx`(`user_id`, `module_slug`),
    INDEX `ump_user_kind_idx`(`user_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_module_plans` ADD CONSTRAINT `user_module_plans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
