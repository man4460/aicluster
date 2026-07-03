-- POS เครื่องดื่ม — ราคาตามขนาด S/M/L

ALTER TABLE `drink_pos_products` ADD COLUMN `size_prices` JSON NULL;

ALTER TABLE `drink_pos_sale_lines` ADD COLUMN `size_label` VARCHAR(8) NULL;
