-- ยอดเงินสดต่อครั้ง (walk-in) สำหรับสรุปรายได้ในประวัติ
ALTER TABLE `barber_service_logs` ADD COLUMN `amount_baht` DECIMAL(10, 2) NULL;
