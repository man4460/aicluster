-- เก็บระยะเวลาแพ็กเกจซักผ้าเป็นชั่วโมงทศนิยม (เดิม duration_minutes → /60)

ALTER TABLE `laundry_packages` ADD COLUMN `duration_hours` DECIMAL(10, 3) NOT NULL DEFAULT 24.000;

UPDATE `laundry_packages` SET `duration_hours` = `duration_minutes` / 60;

ALTER TABLE `laundry_packages` DROP COLUMN `duration_minutes`;
