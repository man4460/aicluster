-- Add Car Wash module to module_list (group 1)
INSERT INTO `module_list` (
  `id`,
  `slug`,
  `title`,
  `description`,
  `group_id`,
  `sort_order`,
  `is_active`,
  `created_at`,
  `updated_at`
)
SELECT
  'car-wash-module',
  'car-wash',
  'ระบบจัดการคาร์แคร์',
  'กลุ่ม 1 (Basic) — แพ็กเกจบริการ บันทึกเข้ารับบริการ และติดตามร้องเรียน',
  1,
  18,
  TRUE,
  NOW(3),
  NOW(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `module_list` WHERE `slug` = 'car-wash'
);

