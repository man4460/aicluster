-- ล็อกอินด้วย Google: รหัสผ่านไม่บังคับ + ผูก google sub
ALTER TABLE `User` MODIFY `passwordHash` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `google_sub` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `User_google_sub_key` ON `User`(`google_sub`);
