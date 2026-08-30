ALTER TABLE `hotel_resort_reviews`
  ADD COLUMN `photo_urls_json` TEXT NOT NULL DEFAULT ('[]');
