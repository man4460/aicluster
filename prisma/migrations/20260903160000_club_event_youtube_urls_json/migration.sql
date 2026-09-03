-- Multi YouTube URLs per club event (JSON array); backfill from youtube_embed_url
ALTER TABLE `club_event_records`
  ADD COLUMN `youtube_urls_json` TEXT NOT NULL DEFAULT ('[]');

UPDATE `club_event_records`
SET `youtube_urls_json` = CASE
  WHEN `youtube_embed_url` IS NOT NULL AND TRIM(`youtube_embed_url`) <> ''
    THEN JSON_ARRAY(`youtube_embed_url`)
  ELSE '[]'
END;
