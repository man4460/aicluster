-- Add due-date fields for home finance utility/vehicle profiles
ALTER TABLE `home_utility_profiles`
  ADD COLUMN `due_date` DATE NULL AFTER `default_due_day`;

ALTER TABLE `home_vehicle_profiles`
  ADD COLUMN `tax_due_date` DATE NULL AFTER `vehicle_year`,
  ADD COLUMN `service_due_date` DATE NULL AFTER `tax_due_date`,
  ADD COLUMN `insurance_due_date` DATE NULL AFTER `service_due_date`;
