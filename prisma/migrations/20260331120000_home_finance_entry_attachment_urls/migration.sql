-- เอกสารแนบหลายไฟล์ต่อรายการรายรับ–รายจ่าย
-- Idempotent: ครั้งก่อนล้มเหลวอาจค้างคอลัมน์ attachment_urls อยู่แล้ว
SET @exist := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'home_finance_entries'
    AND COLUMN_NAME = 'attachment_urls'
);
SET @sqlstmt := IF(
  @exist = 0,
  'ALTER TABLE `home_finance_entries` ADD COLUMN `attachment_urls` JSON NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `home_finance_entries`
SET `attachment_urls` = JSON_ARRAY(`slip_image_url`)
WHERE `attachment_urls` IS NULL
  AND `slip_image_url` IS NOT NULL AND TRIM(`slip_image_url`) <> '';
