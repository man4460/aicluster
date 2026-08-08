-- Hotel resort: buildings (multi-tower / multi-building) + rooms.building_id
CREATE TABLE `hotel_resort_buildings` (
  `id` VARCHAR(191) NOT NULL,
  `owner_user_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `code` VARCHAR(40) NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `note` VARCHAR(300) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `hr_building_owner_name_uq`(`owner_user_id`, `name`),
  INDEX `hr_building_owner_sort_idx`(`owner_user_id`, `sort_order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `hotel_resort_buildings`
  ADD CONSTRAINT `hotel_resort_buildings_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Default building per owner that already has rooms
INSERT INTO `hotel_resort_buildings` (`id`, `owner_user_id`, `name`, `code`, `sort_order`, `note`, `created_at`, `updated_at`)
SELECT
  CONCAT('hrb_', REPLACE(UUID(), '-', '')),
  `owner_user_id`,
  'อาคารหลัก',
  'MAIN',
  0,
  NULL,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM (
  SELECT DISTINCT `owner_user_id` FROM `hotel_resort_rooms`
) AS owners;

ALTER TABLE `hotel_resort_rooms`
  ADD COLUMN `building_id` VARCHAR(191) NULL AFTER `owner_user_id`;

UPDATE `hotel_resort_rooms` AS r
INNER JOIN `hotel_resort_buildings` AS b
  ON b.`owner_user_id` = r.`owner_user_id` AND b.`name` = 'อาคารหลัก'
SET r.`building_id` = b.`id`
WHERE r.`building_id` IS NULL;

-- Safety: any leftover rooms without building (should be none)
INSERT INTO `hotel_resort_buildings` (`id`, `owner_user_id`, `name`, `code`, `sort_order`, `note`, `created_at`, `updated_at`)
SELECT
  CONCAT('hrb_', REPLACE(UUID(), '-', '')),
  r.`owner_user_id`,
  'อาคารหลัก',
  'MAIN',
  0,
  NULL,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `hotel_resort_rooms` r
WHERE r.`building_id` IS NULL
GROUP BY r.`owner_user_id`;

UPDATE `hotel_resort_rooms` AS r
INNER JOIN `hotel_resort_buildings` AS b
  ON b.`owner_user_id` = r.`owner_user_id` AND b.`name` = 'อาคารหลัก'
SET r.`building_id` = b.`id`
WHERE r.`building_id` IS NULL;

ALTER TABLE `hotel_resort_rooms`
  MODIFY `building_id` VARCHAR(191) NOT NULL;

ALTER TABLE `hotel_resort_rooms`
  DROP INDEX `hr_room_owner_number_uq`;

CREATE UNIQUE INDEX `hr_room_building_number_uq` ON `hotel_resort_rooms`(`building_id`, `room_number`);
CREATE INDEX `hr_room_owner_building_idx` ON `hotel_resort_rooms`(`owner_user_id`, `building_id`);

ALTER TABLE `hotel_resort_rooms`
  ADD CONSTRAINT `hotel_resort_rooms_building_id_fkey`
  FOREIGN KEY (`building_id`) REFERENCES `hotel_resort_buildings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
