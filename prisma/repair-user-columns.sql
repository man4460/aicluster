-- ถ้าแดชบอร์ด error เรื่องคอลัมน์ไม่มี — รันทีละบล็อก (ข้าม error Duplicate column ถ้ามีแล้ว)
-- mysql -u root -p mawell_buffet

ALTER TABLE `User` ADD COLUMN `address` TEXT NULL;
ALTER TABLE `User` ADD COLUMN `avatarUrl` VARCHAR(512) NULL;
ALTER TABLE `User` ADD COLUMN `fullName` VARCHAR(255) NULL;
ALTER TABLE `User` ADD COLUMN `last_deduction_date` DATETIME(3) NULL;
ALTER TABLE `User` ADD COLUMN `latitude` DOUBLE NULL;
ALTER TABLE `User` ADD COLUMN `longitude` DOUBLE NULL;
ALTER TABLE `User` ADD COLUMN `phone` VARCHAR(64) NULL;
ALTER TABLE `User` ADD COLUMN `tokens` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `User` ADD COLUMN `subscription_tier` ENUM('NONE', 'TIER_199', 'TIER_299', 'TIER_399', 'TIER_499', 'TIER_599') NOT NULL DEFAULT 'NONE';
