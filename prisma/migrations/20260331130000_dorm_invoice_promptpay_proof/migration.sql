-- AlterTable
ALTER TABLE `dormitory_profiles` ADD COLUMN `prompt_pay_phone` VARCHAR(20) NULL,
    ADD COLUMN `payment_channels_note` TEXT NULL;

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `proof_slip_url` VARCHAR(512) NULL,
    ADD COLUMN `proof_uploaded_at` DATETIME(3) NULL,
    ADD COLUMN `public_proof_token` VARCHAR(64) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payments_public_proof_token_key` ON `payments`(`public_proof_token`);
