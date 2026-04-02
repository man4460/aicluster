-- เลขที่บ้านแบบเต็ม (เช่น 222/284) — ขยายความยาวและเปรียบเทียบทั้งสตริง
ALTER TABLE `village_houses` MODIFY COLUMN `house_no` VARCHAR(120) NOT NULL;
