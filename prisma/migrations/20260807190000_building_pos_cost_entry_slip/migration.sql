-- Building POS cost entries: optional payment slip
ALTER TABLE `building_pos_cost_entries`
  ADD COLUMN `payment_slip_url` VARCHAR(2048) NOT NULL DEFAULT '';
