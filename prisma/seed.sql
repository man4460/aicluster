-- MAWELL — ข้อมูลตัวอย่างโมดูลหอพัก (MySQL)
-- เงื่อนไข: มีแถวในตาราง `User` อย่างน้อย 1 แถว (เช่น รัน `npm run db:seed` ของ Prisma ก่อน)
-- รันด้วย: mysql -u ... -p ... < prisma/seed.sql
-- UI ใช้ฟอนต์ Noto Sans Thai + โลโก้ MAWELL กำหนดในแอป ไม่ได้อยู่ใน DB

SET @owner_id := (SELECT `id` FROM `User` ORDER BY `createdAt` ASC LIMIT 1);

INSERT INTO `rooms` (`owner_id`, `room_number`, `floor`, `room_type`, `max_occupants`, `base_price`, `status`, `created_at`, `updated_at`)
VALUES (@owner_id, '101', 1, 'แอร์', 2, 4500.00, 'OCCUPIED', NOW(3), NOW(3));

SET @room_101 := LAST_INSERT_ID();

INSERT INTO `tenants` (`room_id`, `name`, `phone`, `id_card`, `status`, `check_in_date`, `created_at`, `updated_at`)
VALUES
  (@room_101, 'สมชาย ใจดี', '0812345678', '1103702541234', 'ACTIVE', '2025-01-15', NOW(3), NOW(3)),
  (@room_101, 'สมหญิง รักเรียน', '0898765432', '1103702545678', 'ACTIVE', '2025-01-15', NOW(3), NOW(3));

SET @tenant_a := (SELECT `id` FROM `tenants` WHERE `room_id` = @room_101 ORDER BY `id` ASC LIMIT 1);
SET @tenant_b := (SELECT `id` FROM `tenants` WHERE `room_id` = @room_101 ORDER BY `id` ASC LIMIT 1 OFFSET 1);

INSERT INTO `utility_bills` (
  `room_id`, `billing_month`, `billing_year`,
  `water_meter_prev`, `water_meter_curr`,
  `electric_meter_prev`, `electric_meter_curr`,
  `water_price`, `electric_price`,
  `fixed_fees`, `total_room_amount`,
  `created_at`, `updated_at`
) VALUES (
  @room_101, 3, 2025,
  100, 108,
  1200, 1250,
  18.00, 8.00,
  CAST('{"internet":300,"trash":50}' AS JSON),
  894.00,
  NOW(3), NOW(3)
);

SET @bill_id := LAST_INSERT_ID();

-- Split (4500 + 894) / 2 = 2697.00
INSERT INTO `payments` (`tenant_id`, `bill_id`, `amount_to_pay`, `payment_status`, `paid_at`, `receipt_number`, `note`, `created_at`, `updated_at`)
VALUES
  (@tenant_a, @bill_id, 2697.00, 'PENDING', NULL, NULL, 'ตัวอย่าง split bill', NOW(3), NOW(3)),
  (@tenant_b, @bill_id, 2697.00, 'PAID', NOW(3), CONCAT('RCP-', UNIX_TIMESTAMP()), NULL, NOW(3), NOW(3));
