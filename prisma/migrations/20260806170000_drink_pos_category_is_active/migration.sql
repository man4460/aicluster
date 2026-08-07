-- Drink POS categories: is_active (parity with building-pos)
ALTER TABLE `drink_pos_categories`
  ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;
