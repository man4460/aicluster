CREATE TABLE IF NOT EXISTS `home_finance_personal_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `category` VARCHAR(80) NULL,
    `file_url` VARCHAR(512) NOT NULL,
    `mime_type` VARCHAR(80) NULL,
    `note` VARCHAR(600) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `home_finance_personal_documents_owner_id_created_at_idx`(`owner_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_hf_doc_owner := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_personal_documents'
    AND CONSTRAINT_NAME = 'home_finance_personal_documents_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_hf_doc_owner := IF(@fk_hf_doc_owner = 0,
  'ALTER TABLE `home_finance_personal_documents` ADD CONSTRAINT `home_finance_personal_documents_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hf_doc1 FROM @sql_hf_doc_owner; EXECUTE hf_doc1; DEALLOCATE PREPARE hf_doc1;
