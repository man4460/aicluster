-- โทเคนลิงก์อัปโหลดสลิปสาธารณะของบิลค่าส่วนกลาง (ใบแจ้งหนี้หมู่บ้าน)
ALTER TABLE `village_common_fee_rows` ADD COLUMN `public_proof_token` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `village_common_fee_rows_public_proof_token_key` ON `village_common_fee_rows`(`public_proof_token`);
