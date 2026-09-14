-- Pro Resume skills — รูปปก · แกลเลอรี · คำอธิบายสั้น (แบบผลงาน)
ALTER TABLE `resume_skills` ADD COLUMN `short_desc` VARCHAR(500) NOT NULL DEFAULT '' AFTER `level`;
ALTER TABLE `resume_skills` ADD COLUMN `cover_image` VARCHAR(512) NULL AFTER `description`;
ALTER TABLE `resume_skills` ADD COLUMN `images_json` TEXT NULL AFTER `cover_image`;
UPDATE `resume_skills` SET `images_json` = '[]' WHERE `images_json` IS NULL;
ALTER TABLE `resume_skills` MODIFY `images_json` TEXT NOT NULL;
