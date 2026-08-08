-- Slip size for order-queue / kitchen tickets (separate from customer receipt)
ALTER TABLE `drink_pos_shop_profiles`
  ADD COLUMN `order_ticket_slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58' AFTER `slip_paper_size`;

ALTER TABLE `module_shop_brandings`
  ADD COLUMN `order_ticket_slip_paper_size` VARCHAR(16) NOT NULL DEFAULT 'SLIP_58' AFTER `slip_paper_size`;
