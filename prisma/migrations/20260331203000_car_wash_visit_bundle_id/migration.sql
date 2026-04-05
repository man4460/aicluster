-- Pending bundle link: deduct used_uses only when visit becomes PAID
ALTER TABLE `car_wash_visits` ADD COLUMN `bundle_id` INTEGER NULL;

ALTER TABLE `car_wash_visits` ADD CONSTRAINT `car_wash_visits_bundle_id_fkey`
  FOREIGN KEY (`bundle_id`) REFERENCES `car_wash_bundles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
