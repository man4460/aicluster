-- Parking customer booking portal media (compatible with MySQL versions
-- that do not support ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
SET @has_banner := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parking_sites'
    AND COLUMN_NAME = 'portal_banner_url'
);
SET @banner_sql := IF(
  @has_banner = 0,
  'ALTER TABLE `parking_sites` ADD COLUMN `portal_banner_url` VARCHAR(512) NULL',
  'SELECT 1'
);
PREPARE parking_banner_stmt FROM @banner_sql;
EXECUTE parking_banner_stmt;
DEALLOCATE PREPARE parking_banner_stmt;

SET @has_gallery := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parking_sites'
    AND COLUMN_NAME = 'portal_gallery_json'
);
SET @gallery_sql := IF(
  @has_gallery = 0,
  'ALTER TABLE `parking_sites` ADD COLUMN `portal_gallery_json` TEXT NOT NULL DEFAULT (''[]'')',
  'SELECT 1'
);
PREPARE parking_gallery_stmt FROM @gallery_sql;
EXECUTE parking_gallery_stmt;
DEALLOCATE PREPARE parking_gallery_stmt;
