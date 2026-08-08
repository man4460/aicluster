-- Room details for booking-site style amenities
ALTER TABLE `hotel_resort_rooms`
  ADD COLUMN `bed_type` VARCHAR(80) NULL AFTER `status`,
  ADD COLUMN `room_size_sqm` INTEGER NULL AFTER `bed_type`,
  ADD COLUMN `view_type` VARCHAR(80) NULL AFTER `room_size_sqm`,
  ADD COLUMN `amenities_json` VARCHAR(1000) NULL AFTER `view_type`;
