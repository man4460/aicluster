-- อัปเดตชื่อโมดูลเช็คชื่อใน module_list ให้ตรงกับ UI (รันเมื่อ DB เก่ายังเป็น "ระบบเช็คชื่อ")
UPDATE `module_list` SET `title` = 'ระบบเช็คชื่ออัจฉริยะ' WHERE `slug` = 'attendance';
