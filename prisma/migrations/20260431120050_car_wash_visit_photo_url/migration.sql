-- รูปแนบรายการล้างรถ (สลิป/หลักฐาน)
ALTER TABLE `car_wash_visits` ADD COLUMN `photo_url` VARCHAR(512) NOT NULL DEFAULT '';
