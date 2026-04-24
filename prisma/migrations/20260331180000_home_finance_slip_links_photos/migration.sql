-- AlterTable
ALTER TABLE `home_finance_entries`
  ADD COLUMN `slip_image_url` VARCHAR(512) NULL,
  ADD COLUMN `linked_utility_id` INT NULL,
  ADD COLUMN `linked_vehicle_id` INT NULL;

-- AlterTable
ALTER TABLE `home_utility_profiles`
  ADD COLUMN `photo_url` VARCHAR(512) NULL;

-- AlterTable
ALTER TABLE `home_vehicle_profiles`
  ADD COLUMN `photo_url` VARCHAR(512) NULL;

-- CreateIndex
CREATE INDEX `home_finance_entries_linked_utility_id_idx` ON `home_finance_entries`(`linked_utility_id`);

-- CreateIndex
CREATE INDEX `home_finance_entries_linked_vehicle_id_idx` ON `home_finance_entries`(`linked_vehicle_id`);

-- AddForeignKey
ALTER TABLE `home_finance_entries` ADD CONSTRAINT `home_finance_entries_linked_utility_id_fkey` FOREIGN KEY (`linked_utility_id`) REFERENCES `home_utility_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `home_finance_entries` ADD CONSTRAINT `home_finance_entries_linked_vehicle_id_fkey` FOREIGN KEY (`linked_vehicle_id`) REFERENCES `home_vehicle_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
