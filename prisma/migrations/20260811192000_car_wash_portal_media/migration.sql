-- AlterTable: add car-wash portal media columns (idempotent for partial applies)

SET @db := DATABASE();

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'car_wash_shop_profiles' AND COLUMN_NAME = 'address');
SET @sql := IF(@exist = 0, 'ALTER TABLE `car_wash_shop_profiles` ADD COLUMN `address` TEXT NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'car_wash_shop_profiles' AND COLUMN_NAME = 'contact_line');
SET @sql := IF(@exist = 0, 'ALTER TABLE `car_wash_shop_profiles` ADD COLUMN `contact_line` VARCHAR(120) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'car_wash_shop_profiles' AND COLUMN_NAME = 'facebook_url');
SET @sql := IF(@exist = 0, 'ALTER TABLE `car_wash_shop_profiles` ADD COLUMN `facebook_url` VARCHAR(512) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'car_wash_shop_profiles' AND COLUMN_NAME = 'map_url');
SET @sql := IF(@exist = 0, 'ALTER TABLE `car_wash_shop_profiles` ADD COLUMN `map_url` VARCHAR(512) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'car_wash_shop_profiles' AND COLUMN_NAME = 'portal_banner_url');
SET @sql := IF(@exist = 0, 'ALTER TABLE `car_wash_shop_profiles` ADD COLUMN `portal_banner_url` VARCHAR(512) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'car_wash_shop_profiles' AND COLUMN_NAME = 'portal_gallery_json');
SET @sql := IF(@exist = 0, 'ALTER TABLE `car_wash_shop_profiles` ADD COLUMN `portal_gallery_json` VARCHAR(4000) NOT NULL DEFAULT ''[]''', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;