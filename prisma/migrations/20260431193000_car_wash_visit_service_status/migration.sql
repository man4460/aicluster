-- สถานะคันในลานล้าง (แดชบอร์ดแบบ POS)
ALTER TABLE `car_wash_visits` ADD COLUMN `service_status` VARCHAR(32) NOT NULL DEFAULT 'COMPLETED';
