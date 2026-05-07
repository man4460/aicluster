-- Public pickup tracking token (QR flow only); nullable unique for legacy rows.
ALTER TABLE `laundry_orders` ADD COLUMN `pickup_public_token` VARCHAR(36) NULL;
CREATE UNIQUE INDEX `laundry_ord_pickup_pub_tok_key` ON `laundry_orders` (`pickup_public_token`);
