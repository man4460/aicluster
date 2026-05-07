-- เก็บระยะเวลาแพ็กเกจเป็นหน่วยนาที (เดิม duration_hours → ×60)

ALTER TABLE `laundry_packages` ADD COLUMN `duration_minutes` INTEGER NOT NULL DEFAULT 1440;

UPDATE `laundry_packages` SET `duration_minutes` = `duration_hours` * 60;

ALTER TABLE `laundry_packages` DROP COLUMN `duration_hours`;
