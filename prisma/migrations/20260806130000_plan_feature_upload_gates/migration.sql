-- เงื่อนไขอัปโหลดสลิป / อัปโหลดเอกสาร (แอดมินเปิด-ปิดได้)
ALTER TABLE `plan_feature_policy`
  ADD COLUMN `slip_upload_gate_enabled` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `document_upload_gate_enabled` BOOLEAN NOT NULL DEFAULT true;
