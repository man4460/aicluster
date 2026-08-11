-- AlterTable
ALTER TABLE `barber_stylists`
  ADD COLUMN `work_start_time` VARCHAR(5) NOT NULL DEFAULT '09:00',
  ADD COLUMN `work_end_time` VARCHAR(5) NOT NULL DEFAULT '20:00',
  ADD COLUMN `off_weekdays_json` VARCHAR(64) NOT NULL DEFAULT '[]';
