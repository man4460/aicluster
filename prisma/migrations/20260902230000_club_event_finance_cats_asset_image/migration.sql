-- Club event: finance categories + asset image
ALTER TABLE `club_event_profiles`
  ADD COLUMN `finance_categories_json` VARCHAR(4000) NOT NULL DEFAULT '[]';

ALTER TABLE `club_event_assets`
  ADD COLUMN `image_url` VARCHAR(512) NULL;
