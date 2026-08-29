-- Village house billing start month + profile auto-generate fees
ALTER TABLE `village_houses`
  ADD COLUMN `billing_start_ym` VARCHAR(7) NULL;

ALTER TABLE `village_profiles`
  ADD COLUMN `auto_generate_fees` BOOLEAN NOT NULL DEFAULT true;
