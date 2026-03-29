-- AlterTable
ALTER TABLE `attendance_roster_entries` ADD COLUMN `roster_shift_index` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `attendance_logs` ADD COLUMN `applied_shift_index` INTEGER NULL;
