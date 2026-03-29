-- โมดูลหอพักย้ายไปกลุ่ม 1 (Basic) ให้สอดคล้อง seed และ canAccessAppModule
UPDATE `module_list`
SET
  `group_id` = 1,
  `sort_order` = 15,
  `description` = 'กลุ่ม 1 (Basic) — ห้อง/ผู้เข้าพัก มิเตอร์น้ำไฟ Split Bill ใบเสร็จ'
WHERE `slug` = 'dormitory';
