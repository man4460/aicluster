-- AlterTable
ALTER TABLE `attendance_logs` ADD COLUMN `check_in_location_id` INTEGER NULL,
    ADD COLUMN `check_out_location_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `alog_check_in_loc_idx` ON `attendance_logs`(`check_in_location_id`);

-- AddForeignKey
ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_check_in_location_id_fkey` FOREIGN KEY (`check_in_location_id`) REFERENCES `attendance_locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_check_out_location_id_fkey` FOREIGN KEY (`check_out_location_id`) REFERENCES `attendance_locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
