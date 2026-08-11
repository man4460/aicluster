-- AlterTable
ALTER TABLE `barber_service_logs` ADD COLUMN `payment_method` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `customer_subscriptions` ADD COLUMN `payment_method` VARCHAR(20) NULL;
