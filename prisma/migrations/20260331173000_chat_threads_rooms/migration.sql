-- กระทู้แชท (ชุมชน / ติดต่อแอดมิน) + ผูก ChatMessage กับ thread

CREATE TABLE `ChatThread` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(280) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `roomKind` ENUM('COMMUNITY', 'ADMIN_SUPPORT') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChatThread_roomKind_createdAt_idx`(`roomKind`, `createdAt`),
    INDEX `ChatThread_authorId_roomKind_idx`(`authorId`, `roomKind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ChatThread` ADD CONSTRAINT `ChatThread_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ChatMessage` ADD COLUMN `threadId` VARCHAR(191) NULL;

-- สร้างกระทู้รวมสำหรับข้อความเก่า (ใช้ผู้ใช้คนแรกในระบบเป็นผู้สร้างกระทู้เทคนิค)
SET @legacy_author := (SELECT `id` FROM `User` ORDER BY `createdAt` ASC LIMIT 1);

INSERT INTO `ChatThread` (`id`, `title`, `authorId`, `roomKind`, `createdAt`, `updatedAt`)
SELECT 'cm_legacy_community_v1', 'แชทชุมชน (ข้อความก่อนปรับระบบ)', @legacy_author, 'COMMUNITY', NOW(3), NOW(3)
FROM DUAL
WHERE @legacy_author IS NOT NULL;

UPDATE `ChatMessage`
SET `threadId` = 'cm_legacy_community_v1'
WHERE `threadId` IS NULL
  AND EXISTS (SELECT 1 FROM `ChatThread` WHERE `id` = 'cm_legacy_community_v1');

-- ถ้าไม่มี User เลย แต่มีข้อความค้าง (ไม่น่ามี) — ลบหรือข้าม; กรณีปกติทำ NOT NULL
ALTER TABLE `ChatMessage` MODIFY `threadId` VARCHAR(191) NOT NULL;

ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `ChatThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
