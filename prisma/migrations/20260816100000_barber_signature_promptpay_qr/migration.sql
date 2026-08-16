-- Barber: customer signature on package deduct + optional static PromptPay QR image
ALTER TABLE `barber_service_logs`
  ADD COLUMN `signature_image_url` VARCHAR(512) NULL AFTER `receipt_image_url`;

ALTER TABLE `barber_shop_profiles`
  ADD COLUMN `prompt_pay_qr_image_url` VARCHAR(512) NULL AFTER `prompt_pay_phone`;
