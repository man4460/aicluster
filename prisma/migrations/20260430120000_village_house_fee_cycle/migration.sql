-- รอบเรียกเก็บค่าส่วนกลางต่อหลัง (รายเดือน / รายหกเดือน / รายปี)
ALTER TABLE `village_houses`
ADD COLUMN `fee_cycle` ENUM('MONTHLY', 'SEMI_ANNUAL', 'ANNUAL') NOT NULL DEFAULT 'MONTHLY';
