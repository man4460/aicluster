-- AlterTable: รูปหลักฐานสภาพรถแยกจากสลิป (สูงสุด 10 URL ใน JSON)
ALTER TABLE `car_wash_visits` ADD COLUMN `evidence_photo_urls_json` JSON NULL;
