-- ผู้แนะนำสมัคร (แนะนำต่อ)
ALTER TABLE `User` ADD COLUMN `referred_by_user_id` VARCHAR(191) NULL;

CREATE INDEX `user_referred_by_idx` ON `User`(`referred_by_user_id`);

ALTER TABLE `User` ADD CONSTRAINT `User_referred_by_user_id_fkey` FOREIGN KEY (`referred_by_user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
