-- AlterTable
ALTER TABLE `car_wash_packages`
  ADD COLUMN `total_uses` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `image_url` VARCHAR(512) NULL;

-- Optional: bump default duration for new rows (MySQL keeps existing values)
ALTER TABLE `car_wash_packages`
  MODIFY COLUMN `duration_minutes` INTEGER NOT NULL DEFAULT 60;
