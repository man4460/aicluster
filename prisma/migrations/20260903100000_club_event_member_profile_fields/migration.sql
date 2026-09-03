-- Club event member profile fields
ALTER TABLE `club_event_members`
  ADD COLUMN `first_name` VARCHAR(80) NOT NULL DEFAULT '',
  ADD COLUMN `last_name` VARCHAR(80) NOT NULL DEFAULT '',
  ADD COLUMN `nickname` VARCHAR(80) NOT NULL DEFAULT '',
  ADD COLUMN `gender` VARCHAR(20) NOT NULL DEFAULT '',
  ADD COLUMN `position` VARCHAR(120) NOT NULL DEFAULT '',
  ADD COLUMN `email` VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN `social` VARCHAR(300) NOT NULL DEFAULT '',
  ADD COLUMN `member_code` VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN `data_consent` BOOLEAN NOT NULL DEFAULT false;

-- แยกชื่อเดิมไป first_name (นามสกุลว่างถ้ายังไม่แยก)
UPDATE `club_event_members`
SET `first_name` = CASE
  WHEN TRIM(`name`) = '' THEN ''
  WHEN LOCATE(' ', TRIM(`name`)) > 0 THEN SUBSTRING_INDEX(TRIM(`name`), ' ', 1)
  ELSE TRIM(`name`)
END,
`last_name` = CASE
  WHEN LOCATE(' ', TRIM(`name`)) > 0 THEN TRIM(SUBSTRING(TRIM(`name`), LOCATE(' ', TRIM(`name`)) + 1))
  ELSE ''
END
WHERE `first_name` = '' AND `last_name` = '';

CREATE INDEX `club_event_member_profile_code_idx` ON `club_event_members`(`profile_id`, `member_code`);
