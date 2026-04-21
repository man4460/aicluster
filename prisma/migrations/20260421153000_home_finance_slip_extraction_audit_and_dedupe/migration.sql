-- เก็บประวัติผล OCR/AI จากการอ่านสลิปรายรับ-รายจ่าย
CREATE TABLE `home_finance_slip_extractions` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(191) NOT NULL,
  `entry_id` INTEGER NULL,
  `source_url` VARCHAR(512) NOT NULL,
  `mime_type` VARCHAR(80) NOT NULL,
  `status` ENUM('SAVED', 'NEEDS_REVIEW', 'FAILED', 'DUPLICATE') NOT NULL,
  `confidence` DECIMAL(5, 4) NULL,
  `predicted_type` ENUM('INCOME', 'EXPENSE') NULL,
  `predicted_amount` DECIMAL(12, 2) NULL,
  `predicted_entry_date` DATE NULL,
  `predicted_title` VARCHAR(200) NULL,
  `predicted_bill_number` VARCHAR(120) NULL,
  `predicted_payment_method` VARCHAR(60) NULL,
  `raw_ocr_text` TEXT NULL,
  `raw_ai_json` JSON NULL,
  `error_message` VARCHAR(300) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `hf_slip_extract_owner_created_idx`(`owner_id`, `created_at`),
  INDEX `hf_slip_extract_entry_idx`(`entry_id`),
  INDEX `hf_slip_extract_owner_status_idx`(`owner_id`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `home_finance_slip_extractions`
  ADD CONSTRAINT `home_finance_slip_extractions_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `home_finance_slip_extractions`
  ADD CONSTRAINT `home_finance_slip_extractions_entry_id_fkey`
  FOREIGN KEY (`entry_id`) REFERENCES `home_finance_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
