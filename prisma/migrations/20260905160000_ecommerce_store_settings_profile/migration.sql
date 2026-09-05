-- AlterTable ecommerce_stores — ฟิลด์ตั้งค่าแบบซักผ้า (พื้นฐาน · การเงิน · เว็ปลิงค์)
ALTER TABLE `ecommerce_stores`
  ADD COLUMN `tagline` VARCHAR(300) NULL,
  ADD COLUMN `contact_phone` VARCHAR(32) NULL,
  ADD COLUMN `address` VARCHAR(500) NULL,
  ADD COLUMN `prompt_pay_qr_image_url` VARCHAR(512) NULL,
  ADD COLUMN `tax_id` VARCHAR(30) NULL,
  ADD COLUMN `slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58',
  ADD COLUMN `contact_line` VARCHAR(120) NULL,
  ADD COLUMN `facebook_url` VARCHAR(512) NULL,
  ADD COLUMN `map_url` VARCHAR(512) NULL;
