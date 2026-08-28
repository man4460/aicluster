-- Drink POS: optional static PromptPay QR image on shop profile
ALTER TABLE `drink_pos_shop_profiles`
  ADD COLUMN `prompt_pay_qr_image_url` VARCHAR(512) NULL AFTER `prompt_pay_phone`;
