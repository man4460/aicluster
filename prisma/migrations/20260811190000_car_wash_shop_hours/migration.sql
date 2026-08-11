-- AlterTable
ALTER TABLE `car_wash_shop_profiles` ADD COLUMN `open_time` VARCHAR(5) NOT NULL DEFAULT '08:00';
ALTER TABLE `car_wash_shop_profiles` ADD COLUMN `close_time` VARCHAR(5) NOT NULL DEFAULT '20:00';
ALTER TABLE `car_wash_shop_profiles` ADD COLUMN `open_weekdays_json` VARCHAR(64) NOT NULL DEFAULT '[0,1,2,3,4,5,6]';
