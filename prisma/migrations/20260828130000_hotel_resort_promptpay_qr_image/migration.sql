-- รูป QR พร้อมเพย์ที่อัปโหลดเอง — ให้สอดคล้อง MODULE_SHOP_PAYMENT_SELECT
ALTER TABLE `hotel_resort_profiles`
  ADD COLUMN `prompt_pay_qr_image_url` VARCHAR(512) NULL AFTER `prompt_pay_phone`;
