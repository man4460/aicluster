-- CreateTable
CREATE TABLE `wait_queue_sites` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(120) NOT NULL,
    `call_message` VARCHAR(200) NOT NULL DEFAULT 'ถึงคิวแล้ว เชิญเข้าร้าน',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wait_queue_site_owner_name_trial_uniq`(`owner_user_id`, `name`, `trial_session_id`),
    INDEX `wait_queue_site_owner_idx`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wait_queue_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `site_id` VARCHAR(191) NOT NULL,
    `date_key` VARCHAR(10) NOT NULL,
    `ticket_seq` INTEGER NOT NULL,
    `ticket_label` VARCHAR(16) NOT NULL,
    `party_size` INTEGER NOT NULL DEFAULT 1,
    `customer_name` VARCHAR(120) NULL,
    `note` VARCHAR(500) NULL,
    `status` ENUM('WAITING', 'CALLED', 'SEATED', 'CANCELLED', 'SKIPPED') NOT NULL DEFAULT 'WAITING',
    `called_at` DATETIME(3) NULL,
    `seated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wait_queue_ticket_site_date_seq_uniq`(`site_id`, `date_key`, `ticket_seq`),
    INDEX `wait_queue_ticket_site_date_status_idx`(`site_id`, `date_key`, `status`),
    INDEX `wait_queue_ticket_site_status_idx`(`site_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `wait_queue_sites` ADD CONSTRAINT `wait_queue_sites_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wait_queue_tickets` ADD CONSTRAINT `wait_queue_tickets_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `wait_queue_sites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
