-- อัตราค่าจ้างเหมากะบนแม่แบบกะ (work-back ปกติ/OT)
ALTER TABLE `smart_guard_duty_templates`
  ADD COLUMN `shift_rate_baht` INT NOT NULL DEFAULT 0;

UPDATE `smart_guard_duty_templates`
SET `shift_rate_baht` = 600
WHERE `planned_minutes` >= 720 AND `shift_rate_baht` = 0;

UPDATE `smart_guard_duty_templates`
SET `shift_rate_baht` = 400
WHERE `planned_minutes` > 0 AND `planned_minutes` < 720 AND `shift_rate_baht` = 0;
