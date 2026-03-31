ALTER TABLE `building_pos_categories`
  ADD COLUMN `image_url` VARCHAR(512) NOT NULL DEFAULT '' AFTER `name`;

ALTER TABLE `building_pos_menu_items`
  ADD COLUMN `image_url` VARCHAR(512) NOT NULL DEFAULT '' AFTER `name`;
