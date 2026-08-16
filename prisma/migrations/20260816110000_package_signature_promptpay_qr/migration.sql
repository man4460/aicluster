-- Signature before package deduct + optional static PromptPay QR (massage, car-wash branding, football-turf)

ALTER TABLE `massage_service_logs`
  ADD COLUMN `signature_image_url` VARCHAR(512) NULL AFTER `receipt_image_url`;

ALTER TABLE `massage_shop_profiles`
  ADD COLUMN `prompt_pay_qr_image_url` VARCHAR(512) NULL AFTER `prompt_pay_phone`;

ALTER TABLE `module_shop_brandings`
  ADD COLUMN `prompt_pay_qr_image_url` VARCHAR(512) NULL AFTER `prompt_pay_phone`;

ALTER TABLE `car_wash_visits`
  ADD COLUMN `signature_image_url` VARCHAR(512) NULL AFTER `bundle_id`;

ALTER TABLE `football_turf_shop_profiles`
  ADD COLUMN `prompt_pay_qr_image_url` VARCHAR(512) NULL AFTER `promptpay_number`;

ALTER TABLE `football_turf_bookings`
  ADD COLUMN `signature_image_url` VARCHAR(512) NULL AFTER `promotion_sale_id`;
