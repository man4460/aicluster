-- AlterTable (ชื่อตารางต้องตรงกับ Prisma: `User`)
ALTER TABLE `User` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `avatarUrl` VARCHAR(512) NULL,
    ADD COLUMN `fullName` VARCHAR(255) NULL,
    ADD COLUMN `last_deduction_date` DATETIME(3) NULL,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL,
    ADD COLUMN `phone` VARCHAR(64) NULL,
    ADD COLUMN `subscription_tier` ENUM('NONE', 'TIER_199', 'TIER_299', 'TIER_399', 'TIER_499', 'TIER_599') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `tokens` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(2000) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatMessage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopUpOrder` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amountBaht` INTEGER NOT NULL,
    `tokensToAdd` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `externalRef` VARCHAR(191) NULL,
    `melodyMeta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TopUpOrder_externalRef_key`(`externalRef`),
    INDEX `TopUpOrder_userId_idx`(`userId`),
    INDEX `TopUpOrder_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopUpOrder` ADD CONSTRAINT `TopUpOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
