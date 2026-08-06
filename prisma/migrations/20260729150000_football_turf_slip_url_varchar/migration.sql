-- สลิปเก็บเป็น path ไฟล์ (ไม่เก็บ data URL ยาวใน TEXT)
ALTER TABLE `football_turf_bookings`
  MODIFY COLUMN `payment_slip_data_url` VARCHAR(512) NULL;

ALTER TABLE `football_turf_promotion_sales`
  MODIFY COLUMN `payment_slip_data_url` VARCHAR(512) NULL;
