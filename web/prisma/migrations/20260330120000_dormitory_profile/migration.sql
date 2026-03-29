-- CreateTable (IF NOT EXISTS — กรณีรอบก่อนสร้างตารางสำเร็จแล้วแต่ FK ล้ม → deploy รอบใหม่ไม่ชน 1050)
CREATE TABLE IF NOT EXISTS `dormitory_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(200) NULL,
    `logo_url` VARCHAR(512) NULL,
    `tax_id` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `caretaker_phone` VARCHAR(32) NULL,
    `default_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dormitory_profiles_owner_id_key`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey เฉพาะเมื่อยังไม่มี (กรณีเพิ่ม FK ด้วยมือแล้ว หรือรันซ้ำ)
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'dormitory_profiles'
    AND CONSTRAINT_NAME = 'dormitory_profiles_owner_id_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @add_fk := IF(
  @fk_exists = 0,
  'ALTER TABLE `dormitory_profiles` ADD CONSTRAINT `dormitory_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @add_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
