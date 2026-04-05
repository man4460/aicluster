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
  'building-pos-module',
  'building-pos',
  'ระบบ POS ร้านอาหารอาคาร',
  'กลุ่ม 1 (Basic) — เพิ่มเมนู จัดหมวดหมู่ รับออเดอร์ และ QR สั่งอาหารด้วยตนเอง',
  1,
  20,
  TRUE,
  NOW(3),
  NOW(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `module_list` WHERE `slug` = 'building-pos'
);
