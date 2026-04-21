-- Add Laundry module to module_list (group 1 — Basic / สายรายวัน + แพ็กเหมา 199)
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
  'laundry-module',
  'laundry',
  'รับฝากซักผ้า',
  'กลุ่ม 1 (Basic) — รับผ้าที่บ้าน คิวซัก-ส่งคืน ใช้ได้ทั้งสายรายวัน (มียอดโทเคน) และแพ็กเหมา 199 โทเคน/เดือน',
  1,
  22,
  TRUE,
  NOW(3),
  NOW(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `module_list` WHERE `slug` = 'laundry'
);
