-- Per-module daily token charge log (DAILY plan, group 1)
-- Allows daily-tier users to access multiple group-1 modules, charged 1 token per module per Bangkok day

CREATE TABLE `user_module_daily_charges` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `module_slug` VARCHAR(64) NOT NULL,
    `charge_date` DATE NOT NULL,
    `tokens_charged` INT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `umd_user_slug_date_uidx`(`user_id`, `module_slug`, `charge_date`),
    INDEX `umd_user_date_idx`(`user_id`, `charge_date`),
    INDEX `umd_slug_date_idx`(`module_slug`, `charge_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_module_daily_charges`
    ADD CONSTRAINT `user_module_daily_charges_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
