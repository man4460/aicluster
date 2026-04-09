-- เอกสารแนบหลายไฟล์ต่อรายการรายรับ–รายจ่าย
ALTER TABLE `home_finance_entries` ADD COLUMN `attachment_urls` JSON NULL;

UPDATE `home_finance_entries`
SET `attachment_urls` = JSON_ARRAY(`slip_image_url`)
WHERE `slip_image_url` IS NOT NULL AND TRIM(`slip_image_url`) <> '';
