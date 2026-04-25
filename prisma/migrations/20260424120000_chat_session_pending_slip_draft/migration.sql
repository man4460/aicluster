-- Chat AI: เก็บร่างรายการจากสลิปล่าสุดต่อ session (รอผู้ใช้พิมพ์ยืนยัน)
ALTER TABLE `chat_sessions` ADD COLUMN `pending_slip_draft` JSON NULL;
