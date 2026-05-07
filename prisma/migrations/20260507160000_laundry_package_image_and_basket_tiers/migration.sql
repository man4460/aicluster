-- Laundry POS display: package photo + per-basket-tier pricing (JSON array)

ALTER TABLE `laundry_packages`
  ADD COLUMN `image_url` VARCHAR(500) NULL,
  ADD COLUMN `basket_tiers` JSON NULL;
