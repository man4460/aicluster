-- สลิป/หลักฐานการจ่ายตลาด
ALTER TABLE `building_pos_purchase_orders`
ADD COLUMN `payment_slip_url` VARCHAR(2048) NOT NULL DEFAULT '';
